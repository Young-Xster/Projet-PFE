package com.grh.grh.service;

import com.grh.grh.dto.request.shift.CreateShiftAssignmentRequest;
import com.grh.grh.dto.request.shift.UpdateShiftAssignmentRequest;
import com.grh.grh.dto.response.shift.ShiftAssignmentResponse;
import com.grh.grh.entity.*;
import com.grh.grh.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShiftAssignmentService {
    private final ShiftAssignmentRepository shiftAssignmentRepository;
    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final WorkScheduleRepository workScheduleRepository;
    private final SubcontractorRepository subcontractorRepository;
    private final EmployeeScheduleRepository employeeScheduleRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final KeycloakUserService keycloakUserService;

    @Transactional
    public ShiftAssignmentResponse createShift(CreateShiftAssignmentRequest request, Authentication auth) {
        validateCompanyAccess(request.getCompanyId(), auth);

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new IllegalArgumentException("Company not found"));
        WorkSchedule schedule = workScheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));

        List<ShiftAssignment> existing = shiftAssignmentRepository
                .findByEmployeeAndDateRange(request.getEmployeeId(), request.getShiftDate(), request.getShiftDate());
        if (!existing.isEmpty()) {
            throw new IllegalStateException("Employee already has a shift on " + request.getShiftDate());
        }
        boolean onLeave = leaveRequestRepository
                .findOverlappingLeaves(company.getId(), request.getShiftDate(), request.getShiftDate())
                .stream()
                .anyMatch(lr -> lr.getEmployee().getEmployeeId().equals(request.getEmployeeId())
                        && "approved".equalsIgnoreCase(lr.getStatus()));
        if (onLeave) {
            throw new IllegalStateException("Employee is on approved leave on " + request.getShiftDate());
        }

        if (!request.getShiftEndTime().isAfter(request.getShiftStartTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }
        ShiftAssignment shift = ShiftAssignment.builder()
                .company(company)
                .employee(employee)
                .schedule(schedule)
                .shiftDate(request.getShiftDate())
                .shiftStartTime(request.getShiftStartTime())
                .shiftEndTime(request.getShiftEndTime())
                .status(request.getStatus() != null ? request.getStatus() : "scheduled")
                .build();

        shift = shiftAssignmentRepository.save(shift);
        log.info("Created shift for employee {} on {}", request.getEmployeeId(), request.getShiftDate());
        return mapToResponse(shift);
    }

    @Transactional
    public ShiftAssignmentResponse updateShift(UUID shiftId, UpdateShiftAssignmentRequest request, Authentication auth) {
        ShiftAssignment shift = shiftAssignmentRepository.findById(shiftId)
                .orElseThrow(() -> new IllegalArgumentException("Shift not found"));
        validateCompanyAccess(shift.getCompany().getId(), auth);

        if ("completed".equalsIgnoreCase(shift.getStatus())) {
            throw new IllegalStateException("Cannot modify a completed shift");
        }

        if (request.getShiftDate() != null) shift.setShiftDate(request.getShiftDate());
        if (request.getShiftStartTime() != null) shift.setShiftStartTime(request.getShiftStartTime());
        if (request.getShiftEndTime() != null) shift.setShiftEndTime(request.getShiftEndTime());
        if (request.getStatus() != null) {
            String st = request.getStatus().toLowerCase();
            if (!st.equals("scheduled") && !st.equals("completed") && !st.equals("cancelled") && !st.equals("swapped")) {
                throw new IllegalArgumentException("Invalid status. Use: scheduled, completed, cancelled, swapped");
            }
            shift.setStatus(st);
        }

        shift = shiftAssignmentRepository.save(shift);
        log.info("Updated shift: {}", shiftId);
        return mapToResponse(shift);
    }

    //auto generate shifts from schedule
    @Transactional
    public List<ShiftAssignmentResponse> generateShifts(UUID scheduleId, LocalDate startDate, LocalDate endDate, Authentication auth) {
        WorkSchedule schedule = workScheduleRepository.findByIdWithDetails(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));
        validateCompanyAccess(schedule.getCompany().getId(), auth);

        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date must be after start date");
        }
        if (ChronoUnit.DAYS.between(startDate, endDate) > 31) {
            throw new IllegalArgumentException("Cannot generate shifts for more than 31 days at once");
        }

        List<EmployeeSchedule> assignments = employeeScheduleRepository.findByScheduleId(scheduleId);
        if (assignments.isEmpty()) {
            throw new IllegalStateException("No employees/subcontractors assigned to this schedule");
        }

        List<ShiftAssignmentResponse> generated = new ArrayList<>();

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            String dayName = date.getDayOfWeek().name().toLowerCase();

            // Find schedule detail for this day
            LocalDate finalDate = date;
            ScheduleDetail dayDetail = schedule.getScheduleDetails().stream()
                    .filter(d -> d.getDayOfWeek().equalsIgnoreCase(dayName))
                    .findFirst()
                    .orElse(null);

            // Skip non-working days or days without schedule detail
            if (dayDetail == null || !Boolean.TRUE.equals(dayDetail.getIsWorkingDay())) {
                continue;
            }

            for (EmployeeSchedule assignment : assignments) {
                // Check if assignment is effective for this date
                if (finalDate.isBefore(assignment.getEffectiveFrom())) continue;
                if (assignment.getEffectiveTo() != null && finalDate.isAfter(assignment.getEffectiveTo())) continue;

                UUID employeeId = assignment.getEmployee() != null
                        ? assignment.getEmployee().getEmployeeId() : null;

                if (employeeId == null) continue; // subcontractor — skip for auto-gen for now

                // Check if shift already exists
                List<ShiftAssignment> existing = shiftAssignmentRepository
                        .findByEmployeeAndDateRange(employeeId, finalDate, finalDate);
                if (!existing.isEmpty()) continue;

                // Check leave
                boolean onLeave = leaveRequestRepository
                        .findOverlappingLeaves(schedule.getCompany().getId(), finalDate, finalDate)
                        .stream()
                        .anyMatch(lr -> lr.getEmployee().getEmployeeId().equals(employeeId)
                                && "approved".equalsIgnoreCase(lr.getStatus()));
                if (onLeave) continue;
                ShiftAssignment shift = ShiftAssignment.builder()
                        .company(schedule.getCompany())
                        .employee(assignment.getEmployee())
                        .schedule(schedule)
                        .shiftDate(finalDate)
                        .shiftStartTime(dayDetail.getWorkStartTime())
                        .shiftEndTime(dayDetail.getWorkEndTime())
                        .status("scheduled")
                        .build();

                shift = shiftAssignmentRepository.save(shift);
                generated.add(mapToResponse(shift));
            }
        }

        log.info("Generated {} shifts for schedule '{}' from {} to {}",
                generated.size(), schedule.getName(), startDate, endDate);
        return generated;
    }
    
    //queries
    @Transactional(readOnly = true)
    public ShiftAssignmentResponse getShiftById(UUID shiftId, Authentication auth) {
        ShiftAssignment shift = shiftAssignmentRepository.findById(shiftId)
                .orElseThrow(() -> new IllegalArgumentException("Shift not found"));
        validateCompanyAccess(shift.getCompany().getId(), auth);
        return mapToResponse(shift);
    }

    @Transactional(readOnly = true)
    public List<ShiftAssignmentResponse> getShiftsByEmployeeAndRange(
            UUID employeeId, LocalDate startDate, LocalDate endDate, Authentication auth
    ) {
        Employee emp = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        validateCompanyAccess(emp.getCompany().getId(), auth);
        return shiftAssignmentRepository.findByEmployeeAndDateRange(employeeId, startDate, endDate).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ShiftAssignmentResponse> getShiftsByDate(LocalDate date, UUID companyId, Authentication auth) {
        validateCompanyAccess(companyId, auth);
        return shiftAssignmentRepository.findByShiftDate(date).stream()
                .filter(s -> s.getCompany().getId().equals(companyId))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelShift(UUID shiftId, Authentication auth) {
        ShiftAssignment shift = shiftAssignmentRepository.findById(shiftId)
                .orElseThrow(() -> new IllegalArgumentException("Shift not found"));
        validateCompanyAccess(shift.getCompany().getId(), auth);

        if ("completed".equalsIgnoreCase(shift.getStatus())) {
            throw new IllegalStateException("Cannot cancel a completed shift");
        }

        shift.setStatus("cancelled");
        shiftAssignmentRepository.save(shift);
        log.info("Cancelled shift: {}", shiftId);
    }

    //helper methods

    private void validateCompanyAccess(UUID companyId, Authentication auth) {
        if (keycloakUserService.isSuperAdmin(auth)) return;
        UUID userCid = keycloakUserService.getCurrentUserCompanyId(auth);
        if (userCid == null || !userCid.equals(companyId))
            throw new SecurityException("Access denied");
    }

    private ShiftAssignmentResponse mapToResponse(ShiftAssignment s) {
        return ShiftAssignmentResponse.builder()
                .id(s.getId())
                .employeeId(s.getEmployee() != null ? s.getEmployee().getEmployeeId() : null)
                .employeeName(s.getEmployee() != null
                        ? s.getEmployee().getFirstName() + " " + s.getEmployee().getLastName() : null)
                .shiftDate(s.getShiftDate())
                .shiftStartTime(s.getShiftStartTime())
                .shiftEndTime(s.getShiftEndTime())
                .status(s.getStatus())
                .companyId(s.getCompany().getId())
                .companyName(s.getCompany().getName())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
