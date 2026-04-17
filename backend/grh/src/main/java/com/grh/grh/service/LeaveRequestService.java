package com.grh.grh.service;

import com.grh.grh.dto.request.leave.ApproveLeaveRequest;
import com.grh.grh.dto.request.leave.PublicLeaveRequest;
import com.grh.grh.dto.response.leave.LeaveBalanceResponse;
import com.grh.grh.dto.response.leave.LeaveRequestDetailResponse;
import com.grh.grh.dto.response.leave.LeaveRequestResponse;
import com.grh.grh.entity.*;
import com.grh.grh.event.ActivityLogEvent;
import com.grh.grh.event.NotificationEvent;
import com.grh.grh.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final KeycloakUserService keycloakUserService;
    private final EmailService emailService;
    private final ActivityLogService activityLogService;
    private final ApplicationEventPublisher eventPublisher;

    // ─── PUBLIC FLOW ──────────────────────────────────────────────────────────

    @Transactional
    public LeaveRequestResponse submitPublicLeaveRequest(PublicLeaveRequest request) {

        // Identify employee by nationalId + email + companyId
        Employee employee = employeeRepository
            .findByNationalIdAndEmailAndCompanyId(
                request.getNationalId(),
                request.getEmail(),
                request.getCompanyId()
            )
            .orElseThrow(() -> new IllegalArgumentException(
                "No active employee found with the provided National ID and Email"
            ));

        Company company = employee.getCompany();

        LeaveType leaveType = leaveTypeRepository.findById(request.getLeaveTypeId())
            .orElseThrow(() -> new IllegalArgumentException("Leave type not found"));

        // Validate dates
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        long calculatedDays = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;
        BigDecimal calculatedTotal = BigDecimal.valueOf(calculatedDays);
        if (request.getTotalDays() == null || request.getTotalDays().compareTo(calculatedTotal) != 0) {
            throw new IllegalArgumentException("Total days must match the selected date range");
        }

        // Check overlapping requests
        boolean hasOverlap = leaveRequestRepository
            .findOverlappingLeaves(request.getCompanyId(), request.getStartDate(), request.getEndDate())
            .stream()
            .anyMatch(lr ->
                lr.getEmployee().getEmployeeId().equals(employee.getEmployeeId()) &&
                !lr.getStatus().equals("rejected") &&
                !lr.getStatus().equals("cancelled")
            );

        if (hasOverlap) {
            throw new IllegalStateException("You already have a leave request overlapping these dates");
        }

        // Check leave balance if limit exists
        if (leaveType.getMaxDaysPerYear() != null) {
            int year = request.getStartDate().getYear();
            leaveBalanceRepository
                .findByEmployeeEmployeeIdAndLeaveTypeIdAndYear(
                    employee.getEmployeeId(), leaveType.getId(), year)
                .ifPresent(balance -> {
                    if (request.getTotalDays().compareTo(BigDecimal.valueOf(balance.getRemainingDays())) > 0) {
                        throw new IllegalStateException(
                            "Insufficient leave balance. Remaining: " + balance.getRemainingDays() + " days"
                        );
                    }
                });
        }

        // Build and save
        LeaveRequest leaveRequest = LeaveRequest.builder()
            .company(company)
            .employee(employee)
            .leaveType(leaveType)
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .totalDays(request.getTotalDays().intValue())
            .reason(request.getReason())
            .status("pending")
            .build();

        leaveRequest = leaveRequestRepository.save(leaveRequest);

        // Publish notification event
        eventPublisher.publishEvent(NotificationEvent.builder()
            .companyId(company.getId())
            .type("LEAVE_REQUEST_SUBMITTED")
            .title("New Leave Request Submitted")
            .message(employee.getFirstName() + " " + employee.getLastName() + " submitted a leave request from " +
                request.getStartDate() + " to " + request.getEndDate())
            .targetModule("LEAVE")
            .targetId(leaveRequest.getId())
            .importance("MEDIUM")
            .build());

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(company.getId())
            .userId(null)
            .action("LEAVE_REQUEST_SUBMITTED")
            .entityType("LEAVE_REQUEST")
            .entityId(leaveRequest.getId())
            .build());

        // Send confirmation email to employee
        try {
            emailService.sendLeaveRequestConfirmation(
                employee.getEmail(),
                employee.getFirstName() + " " + employee.getLastName(),
                leaveType.getName(),
                request.getStartDate().toString(),
                request.getEndDate().toString(),
                request.getTotalDays().toString()
            );
        } catch (Exception ex) {
            log.warn("Failed to send leave request confirmation email for request {}: {}", leaveRequest.getId(), ex.getMessage());
        }

        log.info("Public leave request submitted for employee: {} ({})",
            employee.getFirstName() + " " + employee.getLastName(),
            employee.getEmployeeId());

        return mapToResponse(leaveRequest);
    }

    // ─── HR FLOW ──────────────────────────────────────────────────────────────

    @Transactional
    public LeaveRequestDetailResponse approveOrRejectLeaveRequest(
        UUID leaveRequestId,
        ApproveLeaveRequest request,
        Authentication authentication
    ) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(leaveRequestId)
            .orElseThrow(() -> new IllegalArgumentException("Leave request not found"));

        validateCompanyAccess(leaveRequest.getCompany().getId(), authentication);

        if (!"pending".equals(leaveRequest.getStatus())) {
            throw new IllegalStateException("Can only review pending leave requests");
        }

        if (!request.getStatus().equals("approved") && !request.getStatus().equals("rejected")) {
            throw new IllegalArgumentException("Status must be 'approved' or 'rejected'");
        }

        UUID currentUserId = keycloakUserService.getCurrentUserId(authentication);
        User reviewer = userRepository.findById(currentUserId)
            .orElseThrow(() -> new IllegalArgumentException("Reviewer not found"));

        leaveRequest.setStatus(request.getStatus());
        leaveRequest.setReviewedBy(reviewer);
        leaveRequest.setReviewedAt(OffsetDateTime.now());
        leaveRequest.setReviewNotes(request.getComments());

        // If approved → deduct balance
        if ("approved".equals(request.getStatus())) {
            deductLeaveBalance(
                leaveRequest.getEmployee().getEmployeeId(),
                leaveRequest.getLeaveType().getId(),
                leaveRequest.getStartDate().getYear(),
                leaveRequest.getTotalDays(),
                leaveRequest.getCompany()
            );
        }

        leaveRequest = leaveRequestRepository.save(leaveRequest);

        String status = request.getStatus();
        String actionType = "approved".equals(status) ? "LEAVE_REQUEST_APPROVED" : "LEAVE_REQUEST_REJECTED";
        String notifType = "approved".equals(status) ? "LEAVE_REQUEST_APPROVED" : "LEAVE_REQUEST_REJECTED";
        String title = "approved".equals(status) ? "Leave Request Approved" : "Leave Request Rejected";
        String message = "approved".equals(status)
            ? "Your leave request from " + leaveRequest.getStartDate() + " to " + leaveRequest.getEndDate() + " has been approved"
            : "Your leave request from " + leaveRequest.getStartDate() + " to " + leaveRequest.getEndDate() + " has been rejected" +
                (request.getComments() != null ? ". Reason: " + request.getComments() : "");

        // Publish notification event
        eventPublisher.publishEvent(NotificationEvent.builder()
            .companyId(leaveRequest.getCompany().getId())
            .type(notifType)
            .title(title)
            .message(message)
            .targetModule("LEAVE")
            .targetId(leaveRequest.getId())
            .importance("HIGH")
            .build());

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(leaveRequest.getCompany().getId())
            .userId(currentUserId)
            .action(actionType)
            .entityType("LEAVE_REQUEST")
            .entityId(leaveRequest.getId())
            .build());

        // Email employee the result
        try {
            emailService.sendLeaveRequestResult(
                leaveRequest.getEmployee().getEmail(),
                leaveRequest.getEmployee().getFirstName() + " " + leaveRequest.getEmployee().getLastName(),
                leaveRequest.getLeaveType().getName(),
                leaveRequest.getStartDate().toString(),
                leaveRequest.getEndDate().toString(),
                request.getStatus(),
                request.getComments()
            );
        } catch (Exception ex) {
            log.warn("Failed to send leave request result email for request {}: {}", leaveRequest.getId(), ex.getMessage());
        }

        log.info("Leave request {} {}", leaveRequestId, request.getStatus());
        
        return mapToDetailResponse(leaveRequest);
    }

    @Transactional
    public void cancelLeaveRequest(UUID leaveRequestId, Authentication authentication) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(leaveRequestId)
            .orElseThrow(() -> new IllegalArgumentException("Leave request not found"));

        validateCompanyAccess(leaveRequest.getCompany().getId(), authentication);

        if ("cancelled".equals(leaveRequest.getStatus())) {
            throw new IllegalStateException("Already cancelled");
        }

        // If was approved, restore balance
        if ("approved".equals(leaveRequest.getStatus())) {
            restoreLeaveBalance(
                leaveRequest.getEmployee().getEmployeeId(),
                leaveRequest.getLeaveType().getId(),
                leaveRequest.getStartDate().getYear(),
                leaveRequest.getTotalDays()
            );
        }

        leaveRequest.setStatus("cancelled");
        leaveRequestRepository.save(leaveRequest);

        UUID currentUserId = keycloakUserService.getCurrentUserId(authentication);

        // Publish notification event
        eventPublisher.publishEvent(NotificationEvent.builder()
            .companyId(leaveRequest.getCompany().getId())
            .type("LEAVE_REQUEST_CANCELLED")
            .title("Leave Request Cancelled")
            .message(leaveRequest.getEmployee().getFirstName() + " " + leaveRequest.getEmployee().getLastName() +
                " cancelled their leave request from " + leaveRequest.getStartDate() + " to " + leaveRequest.getEndDate())
            .targetModule("LEAVE")
            .targetId(leaveRequest.getId())
            .importance("MEDIUM")
            .build());

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(leaveRequest.getCompany().getId())
            .userId(currentUserId)
            .action("LEAVE_REQUEST_CANCELLED")
            .entityType("LEAVE_REQUEST")
            .entityId(leaveRequest.getId())
            .build());

        log.info("Cancelled leave request: {}", leaveRequestId);
    }

    @Transactional(readOnly = true)
    public LeaveRequestDetailResponse getLeaveRequestById(UUID leaveRequestId, Authentication authentication) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(leaveRequestId)
            .orElseThrow(() -> new IllegalArgumentException("Leave request not found"));
        validateCompanyAccess(leaveRequest.getCompany().getId(), authentication);
        return mapToDetailResponse(leaveRequest);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> getLeaveRequestsByCompanyAndStatus(
        UUID companyId, String status, Authentication authentication
    ) {
        validateCompanyAccess(companyId, authentication);
        return leaveRequestRepository.findByCompanyIdAndStatus(companyId, status).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveBalanceResponse> getEmployeeLeaveBalances(UUID employeeId, Authentication authentication) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        validateCompanyAccess(employee.getCompany().getId(), authentication);
        return leaveBalanceRepository.findByEmployeeEmployeeId(employeeId).stream()
            .map(this::mapToBalanceResponse)
            .collect(Collectors.toList());
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private void deductLeaveBalance(UUID employeeId, UUID leaveTypeId, int year, int days, Company company) {
        LeaveBalance balance = leaveBalanceRepository
            .findByEmployeeEmployeeIdAndLeaveTypeIdAndYear(employeeId, leaveTypeId, year)
            .orElseGet(() -> {
                Employee emp = employeeRepository.findById(employeeId).orElseThrow();
                LeaveType lt = leaveTypeRepository.findById(leaveTypeId).orElseThrow();
                return LeaveBalance.builder()
                    .company(company)
                    .employee(emp)
                    .leaveType(lt)
                    .year(year)
                    .totalDays(lt.getMaxDaysPerYear() != null ? lt.getMaxDaysPerYear() : 0)
                    .usedDays(0)
                    .remainingDays(lt.getMaxDaysPerYear() != null ? lt.getMaxDaysPerYear() : 0)
                    .build();
            });

        balance.setUsedDays(balance.getUsedDays() + days);
        balance.setRemainingDays(Math.max(0, balance.getRemainingDays() - days));
        leaveBalanceRepository.save(balance);
    }

    private void restoreLeaveBalance(UUID employeeId, UUID leaveTypeId, int year, int days) {
        leaveBalanceRepository
            .findByEmployeeEmployeeIdAndLeaveTypeIdAndYear(employeeId, leaveTypeId, year)
            .ifPresent(balance -> {
                balance.setUsedDays(Math.max(0, balance.getUsedDays() - days));
                balance.setRemainingDays(balance.getRemainingDays() + days);
                leaveBalanceRepository.save(balance);
            });
    }

    private void validateCompanyAccess(UUID companyId, Authentication authentication) {
        if (keycloakUserService.isSuperAdmin(authentication)) return;
        UUID userCompanyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (userCompanyId == null || !userCompanyId.equals(companyId)) {
            throw new SecurityException("Access denied");
        }
    }

    private LeaveRequestResponse mapToResponse(LeaveRequest lr) {
        return LeaveRequestResponse.builder()
            .id(lr.getId())
            .employeeId(lr.getEmployee().getEmployeeId())
            .employeeName(lr.getEmployee().getFirstName() + " " + lr.getEmployee().getLastName())
            .leaveTypeId(lr.getLeaveType() != null ? lr.getLeaveType().getId() : null)
            .leaveTypeName(lr.getLeaveType() != null ? lr.getLeaveType().getName() : null)
            .startDate(lr.getStartDate())
            .endDate(lr.getEndDate())
            .totalDays(BigDecimal.valueOf(lr.getTotalDays()))
            .status(lr.getStatus())
            .reason(lr.getReason())
            .createdAt(lr.getCreatedAt())
            .build();
    }

    private LeaveRequestDetailResponse mapToDetailResponse(LeaveRequest lr) {
        LeaveRequestDetailResponse.EmployeeInfo employeeInfo = LeaveRequestDetailResponse.EmployeeInfo.builder()
            .employeeId(lr.getEmployee().getEmployeeId())
            .fullName(lr.getEmployee().getFirstName() + " " + lr.getEmployee().getLastName())
            .email(lr.getEmployee().getEmail())
            .department(lr.getEmployee().getDepartment() != null ?
                lr.getEmployee().getDepartment().getName() : null)
            .build();

        LeaveRequestDetailResponse.LeaveTypeInfo leaveTypeInfo = null;
        if (lr.getLeaveType() != null) {
            leaveTypeInfo = LeaveRequestDetailResponse.LeaveTypeInfo.builder()
                .id(lr.getLeaveType().getId())
                .name(lr.getLeaveType().getName())
                .code(lr.getLeaveType().getCode())
                .isPaid(lr.getLeaveType().getIsPaid())
                .build();
        }

        LeaveRequestDetailResponse.ApprovalInfo approvalInfo = null;
        if (lr.getReviewedBy() != null) {
            approvalInfo = LeaveRequestDetailResponse.ApprovalInfo.builder()
                .approvedByName(lr.getReviewedBy().getUsername())
                .approvalDate(lr.getReviewedAt())
                .comments(lr.getReviewNotes())
                .build();
        }

        return LeaveRequestDetailResponse.builder()
            .id(lr.getId())
            .employee(employeeInfo)
            .leaveType(leaveTypeInfo)
            .startDate(lr.getStartDate())
            .endDate(lr.getEndDate())
            .totalDays(BigDecimal.valueOf(lr.getTotalDays()))
            .status(lr.getStatus())
            .reason(lr.getReason())
            .approval(approvalInfo)
            .createdAt(lr.getCreatedAt())
            .updatedAt(lr.getUpdatedAt())
            .build();
    }

    private LeaveBalanceResponse mapToBalanceResponse(LeaveBalance lb) {
        return LeaveBalanceResponse.builder()
            .id(lb.getId())
            .employeeId(lb.getEmployee().getEmployeeId())
            .employeeName(lb.getEmployee().getFirstName() + " " + lb.getEmployee().getLastName())
            .leaveTypeId(lb.getLeaveType().getId())
            .leaveTypeName(lb.getLeaveType().getName())
            .year(lb.getYear())
            .totalDays(BigDecimal.valueOf(lb.getTotalDays()))
            .usedDays(BigDecimal.valueOf(lb.getUsedDays()))
            .remainingDays(BigDecimal.valueOf(lb.getRemainingDays()))
            .build();
    }
}