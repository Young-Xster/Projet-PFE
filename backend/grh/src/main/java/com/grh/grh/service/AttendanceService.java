package com.grh.grh.service;

import com.grh.grh.dto.request.attendance.CreateAttendanceRequest;
import com.grh.grh.dto.request.attendance.UpdateAttendanceRequest;
import com.grh.grh.dto.response.attendance.AttendanceResponse;
import com.grh.grh.entity.*;
import com.grh.grh.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final CompanySettingRepository companySettingRepository;
    private final UserRepository userRepository;
    private final SubcontractorRepository subcontractorRepository;
    private final KeycloakUserService keycloakUserService;


    @Transactional
    public AttendanceResponse createAttendance(CreateAttendanceRequest request, Authentication authentication) {
        UUID companyId = resolveCompanyId(authentication, request.getCompanyId());

        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new IllegalArgumentException("Company not found"));

        // no duplicate record for same employee + date
        if (request.getEmployeeId() != null) {
            attendanceRepository.findByEmployeeEmployeeIdAndDate(request.getEmployeeId(), request.getDate())
                .ifPresent(existing -> {
                    throw new IllegalStateException("Attendance record already exists for this employee on " + request.getDate());
                });
        }

        AttendanceRecord.AttendanceRecordBuilder builder = AttendanceRecord.builder()
            .company(company)
            .date(request.getDate())
            .clockInTime(request.getClockInTime())
            .clockOutTime(request.getClockOutTime())
            .status(request.getStatus() != null ? request.getStatus() : "present")
            .notes(request.getNotes())
            .source("manual");

        if (request.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
            builder.employee(employee);

            // Calculate work duration if both times provided
            if (request.getClockInTime() != null && request.getClockOutTime() != null) {
                builder.workDurationMinutes(calculateWorkDuration(request.getClockInTime(), request.getClockOutTime()));
            }

            // Auto-calculate delay from CompanySetting
            if (request.getClockInTime() != null) {
                Integer delay = calculateDelay(companyId, request.getClockInTime());
                if (delay != null && delay > 0) {
                    builder.delayMinutes(delay);
                    builder.status("late");
                }
            }
        }

        if (request.getSubcontractorId() != null) {
            Subcontractor subcontractor = subcontractorRepository.findById(request.getSubcontractorId())
                .orElseThrow(() -> new IllegalArgumentException("Subcontractor not found"));
            builder.subcontractor(subcontractor);
        }

        if (request.getApprovedById() != null) {
            User approver = userRepository.findById(request.getApprovedById())
                .orElseThrow(() -> new IllegalArgumentException("Approver not found"));
            builder.approvedBy(approver);
        }

        AttendanceRecord record = attendanceRepository.save(builder.build());
        log.info("Created attendance record for date: {} source: manual", request.getDate());
        return mapToResponse(record);
    }

    @Transactional
    public AttendanceResponse updateAttendance(UUID recordId, UpdateAttendanceRequest request, Authentication authentication) {
        AttendanceRecord record = attendanceRepository.findById(recordId)
            .orElseThrow(() -> new IllegalArgumentException("Attendance record not found"));

        validateCompanyAccess(record.getCompany().getId(), authentication);

        if (request.getClockInTime() != null) record.setClockInTime(request.getClockInTime());
        if (request.getClockOutTime() != null) record.setClockOutTime(request.getClockOutTime());
        if (request.getStatus() != null) record.setStatus(request.getStatus());
        if (request.getNotes() != null) record.setNotes(request.getNotes());
        if (request.getDelayMinutes() != null) record.setDelayMinutes(request.getDelayMinutes());

        // Recalculate work duration if both times present
        if (record.getClockInTime() != null && record.getClockOutTime() != null) {
            record.setWorkDurationMinutes(calculateWorkDuration(record.getClockInTime(), record.getClockOutTime()));
        }

        record = attendanceRepository.save(record);
        log.info("Updated attendance record: {}", recordId);
        return mapToResponse(record);
    }

    @Transactional(readOnly = true)
    public AttendanceResponse getAttendanceById(UUID recordId, Authentication authentication) {
        AttendanceRecord record = attendanceRepository.findById(recordId)
            .orElseThrow(() -> new IllegalArgumentException("Attendance record not found"));
        validateCompanyAccess(record.getCompany().getId(), authentication);
        return mapToResponse(record);
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendanceByCompanyAndDate(UUID companyId, LocalDate date, Authentication authentication) {
        validateCompanyAccess(companyId, authentication);
        return attendanceRepository.findByCompanyAndDate(companyId, date).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendanceByCompanyAndDateRange(
        UUID companyId, LocalDate startDate, LocalDate endDate, Authentication authentication
    ) {
        validateCompanyAccess(companyId, authentication);
        return attendanceRepository.findByCompanyAndDateRange(companyId, startDate, endDate).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendanceByEmployee(
        UUID employeeId, LocalDate startDate, LocalDate endDate, Authentication authentication
    ) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        validateCompanyAccess(employee.getCompany().getId(), authentication);
        return attendanceRepository.findByEmployeeAndDateRange(employeeId, startDate, endDate).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public void deleteAttendance(UUID recordId, Authentication authentication) {
        AttendanceRecord record = attendanceRepository.findById(recordId)
            .orElseThrow(() -> new IllegalArgumentException("Attendance record not found"));
        validateCompanyAccess(record.getCompany().getId(), authentication);
        attendanceRepository.delete(record);
        log.info("Deleted attendance record: {}", recordId);
    }

    
    //helpers
    private Integer calculateWorkDuration(OffsetDateTime clockIn, OffsetDateTime clockOut) {
        if (clockIn == null || clockOut == null) return null;
        int minutes = (int) java.time.Duration.between(clockIn, clockOut).toMinutes();
        return minutes > 0 ? minutes : null;
    }

    /**
     * Calculates delay in minutes based on company's workHoursStart and gracePeriodMinutes.
     * Returns null if no company settings found or clock-in is on time.
     */
    private Integer calculateDelay(UUID companyId, OffsetDateTime clockInTime) {
        return companySettingRepository.findByCompanyId(companyId)
            .map(settings -> {
                LocalTime workStart = settings.getWorkHoursStart();
                int gracePeriod = settings.getGracePeriodMinutes() != null ? settings.getGracePeriodMinutes() : 0;
                LocalTime effectiveStart = workStart.plusMinutes(gracePeriod);
                LocalTime clockInLocal = clockInTime.toLocalTime();

                if (clockInLocal.isAfter(effectiveStart)) {
                    return (int) java.time.Duration.between(effectiveStart, clockInLocal).toMinutes();
                }
                return null;
            })
            .orElse(null);
    }

    private UUID resolveCompanyId(Authentication authentication, UUID requestCompanyId) {
        UUID companyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (companyId != null) return companyId;
        if (keycloakUserService.isSuperAdmin(authentication) && requestCompanyId != null) {
            return requestCompanyId;
        }
        throw new IllegalStateException("User is not associated with any company");
    }

    private void validateCompanyAccess(UUID companyId, Authentication authentication) {
        if (keycloakUserService.isSuperAdmin(authentication)) return;
        UUID userCompanyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (userCompanyId == null || !userCompanyId.equals(companyId)) {
            throw new SecurityException("Access denied");
        }
    }

    private AttendanceResponse mapToResponse(AttendanceRecord record) {
        AttendanceResponse.AttendanceResponseBuilder builder = AttendanceResponse.builder()
            .id(record.getId())
            .date(record.getDate())
            .clockInTime(record.getClockInTime())
            .clockOutTime(record.getClockOutTime())
            .status(record.getStatus())
            .notes(record.getNotes())
            .source(record.getSource())
            .delayMinutes(record.getDelayMinutes())
            .workDurationMinutes(record.getWorkDurationMinutes())
            .createdAt(record.getCreatedAt())
            .updatedAt(record.getUpdatedAt());

        if (record.getCompany() != null) {
            builder.companyId(record.getCompany().getId())
                   .companyName(record.getCompany().getName());
        }
        if (record.getEmployee() != null) {
            builder.employeeId(record.getEmployee().getEmployeeId())
                   .employeeName(record.getEmployee().getFirstName() + " " + record.getEmployee().getLastName())
                   .employeeDepartment(record.getEmployee().getDepartment() != null
                       ? record.getEmployee().getDepartment().getName() : null);
        }
        if (record.getSubcontractor() != null) {
            builder.subcontractorId(record.getSubcontractor().getId())
                   .subcontractorName(resolveSubcontractorDisplayName(record.getSubcontractor()));
        }
        if (record.getApprovedBy() != null) {
            builder.approvedById(record.getApprovedBy().getId())
                   .approvedByName(record.getApprovedBy().getUsername());
        }
        return builder.build();
    }

    private String resolveSubcontractorDisplayName(Subcontractor subcontractor) {
        if (subcontractor == null) return null;
        if ("COMPANY".equalsIgnoreCase(subcontractor.getType()) && subcontractor.getCompanyName() != null) {
            return subcontractor.getCompanyName();
        }
        String first = subcontractor.getContactFirstName() != null ? subcontractor.getContactFirstName() : "";
        String last = subcontractor.getContactLastName() != null ? subcontractor.getContactLastName() : "";
        return (first + " " + last).trim();
    }

}