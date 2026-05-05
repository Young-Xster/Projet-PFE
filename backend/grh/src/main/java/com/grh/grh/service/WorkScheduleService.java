package com.grh.grh.service;

import com.grh.grh.dto.request.schedule.CreateWorkScheduleRequest;
import com.grh.grh.dto.request.schedule.UpdateWorkScheduleRequest;
import com.grh.grh.dto.response.schedule.WorkScheduleListResponse;
import com.grh.grh.dto.response.schedule.WorkScheduleResponse;
import com.grh.grh.entity.*;
import com.grh.grh.event.ActivityLogEvent;
import com.grh.grh.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import java.util.LinkedHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkScheduleService {
     private final WorkScheduleRepository workScheduleRepository;
    private final ScheduleDetailRepository scheduleDetailRepository;
    private final EmployeeScheduleRepository employeeScheduleRepository;
    private final EmployeeRepository employeeRepository;
    private final SubcontractorRepository subcontractorRepository;
    private final CompanyRepository companyRepository;
    private final KeycloakUserService keycloakUserService;
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;
    private final ApplicationEventPublisher eventPublisher;

    // schedule crud
    @Transactional
    public WorkScheduleResponse createWorkSchedule(CreateWorkScheduleRequest request , Authentication authentication) {
        UUID companyId = resolveCompanyId(authentication, request.getCompanyId());
        validateCompanyAccess(companyId, authentication);

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException());

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            workScheduleRepository.findDefaultByCompanyId(companyId)
                    .ifPresent(existing -> {
                        existing.setIsDefault(false);
                        workScheduleRepository.save(existing);
                    });
        }

        WorkSchedule schedule = WorkSchedule.builder()
                .company(company)
                .name(request.getScheduleName())
                .description(request.getDescription())
                .isDefault(request.getIsDefault() != null ? request.getIsDefault() : false)
                .build();

        schedule = workScheduleRepository.save(schedule);

        // add schedule details(days of week)

        if(request.getScheduleDetails() != null && !request.getScheduleDetails().isEmpty()){
            validateScheduleDetails(request.getScheduleDetails());
            for(CreateWorkScheduleRequest.ScheduleDetailRequest detailReq : request.getScheduleDetails()){
                ScheduleDetail detail = ScheduleDetail.builder()
                        .schedule(schedule)
                        .dayOfWeek(detailReq.getDayOfWeek().toLowerCase())
                        .workStartTime(detailReq.getStartTime())
                        .workEndTime(detailReq.getEndTime())
                        .isWorkingDay(detailReq.getIsWorkingDay())
                        .build();
                schedule.getScheduleDetails().add(detail);
            }
            schedule = workScheduleRepository.save(schedule);
        }

        log.info("Created work schedule '{}' for company {}", schedule.getName(), companyId);
        String actorCreate = authentication != null ? authentication.getName() : "System";
        notificationService.createNotification(
            companyId,
            "SCHEDULE_UPDATED",
            "New schedule created",
            actorCreate + " created schedule " + schedule.getName() + ".",
            "SCHEDULE",
            schedule.getId(),
            "MEDIUM"
        );

        // Publish activity log event
        UUID currentUserId = keycloakUserService.getCurrentUserId(authentication);
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(companyId)
            .userId(currentUserId)
            .action("SCHEDULE_CREATED")
            .entityType("SCHEDULE")
            .entityId(schedule.getId())
            .build());

        return mapToDetailResponse(schedule);
    }

    @Transactional
    public WorkScheduleResponse updateWorkSchedule(UUID scheduleId, UpdateWorkScheduleRequest request, Authentication authentication) {
        WorkSchedule schedule = workScheduleRepository.findByIdWithDetails(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));
        validateCompanyAccess(schedule.getCompany().getId(), authentication);

        if (request.getScheduleName() != null) schedule.setName(request.getScheduleName());
        if (request.getDescription() != null) schedule.setDescription(request.getDescription());

        // Handle default flag change
        if (request.getIsDefault() != null && request.getIsDefault() && !schedule.getIsDefault()) {
            workScheduleRepository.findDefaultByCompanyId(schedule.getCompany().getId())
                    .ifPresent(existing -> {
                        existing.setIsDefault(false);
                        workScheduleRepository.save(existing);
                    });
            schedule.setIsDefault(true);
        }

        if(request.getScheduleDetails() != null){
            validateScheduleDetails(request.getScheduleDetails());
            schedule.getScheduleDetails().clear();
            for (CreateWorkScheduleRequest.ScheduleDetailRequest detailReq : request.getScheduleDetails()) {
                ScheduleDetail detail = ScheduleDetail.builder()
                        .schedule(schedule)
                        .dayOfWeek(detailReq.getDayOfWeek().toLowerCase())
                        .workStartTime(detailReq.getStartTime())
                        .workEndTime(detailReq.getEndTime())
                        .isWorkingDay(detailReq.getIsWorkingDay())
                        .build();
                schedule.getScheduleDetails().add(detail);
            }
        }

        schedule = workScheduleRepository.save(schedule);
        log.info("Updated work schedule: {}", scheduleId);
        String actorUpdate = authentication != null ? authentication.getName() : "System";
        notificationService.createNotification(
            schedule.getCompany().getId(),
            "SCHEDULE_UPDATED",
            "Schedule updated",
            actorUpdate + " updated schedule " + schedule.getName() + ".",
            "SCHEDULE",
            schedule.getId(),
            "MEDIUM"
        );

        // Publish activity log event
        UUID currentUserIdUpdate = keycloakUserService.getCurrentUserId(authentication);
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(schedule.getCompany().getId())
            .userId(currentUserIdUpdate)
            .action("SCHEDULE_UPDATED")
            .entityType("SCHEDULE")
            .entityId(schedule.getId())
            .build());

        return mapToDetailResponse(schedule);
    }

    @Transactional(readOnly = true)
    public WorkScheduleResponse getScheduleByID(UUID scheduleId, Authentication authentication) {
        WorkSchedule schedule = workScheduleRepository.findByIdWithDetails(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));
        validateCompanyAccess(schedule.getCompany().getId(), authentication);
        return mapToDetailResponse(schedule);
    }

    @Transactional(readOnly = true)
    public List<WorkScheduleListResponse> getSchedulesByCompany(UUID companyId, Authentication authentication) {
        validateCompanyAccess(companyId, authentication);
        return workScheduleRepository.findByCompanyId(companyId).stream()
                .map(this::mapToListResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteSchedule(UUID scheduleId, Authentication authentication) {
        WorkSchedule schedule = workScheduleRepository.findByIdWithDetails(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));
        validateCompanyAccess(schedule.getCompany().getId(), authentication);

        if (Boolean.TRUE.equals(schedule.getIsDefault())) {
            throw new IllegalStateException("Cannot delete the default schedule. Set another schedule as default first.");
        }
        if (!schedule.getEmployeeSchedules().isEmpty()) {
            throw new IllegalStateException("Cannot delete schedule — it is currently assigned to "
                    + schedule.getEmployeeSchedules().size() + " employee(s). Reassign them first.");
        }

        workScheduleRepository.delete(schedule);

        // Publish activity log event
        UUID currentUserIdDelete = keycloakUserService.getCurrentUserId(authentication);
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(schedule.getCompany().getId())
            .userId(currentUserIdDelete)
            .action("SCHEDULE_DELETED")
            .entityType("SCHEDULE")
            .entityId(scheduleId)
            .build());

        log.info("Deleted work schedule: {}", scheduleId);
    }

    // employee <-> schedule assignment

    @Transactional
    public Map<String, Object> assignScheduleToEmployee(UUID employeeId, UUID scheduleId, LocalDate effectiveFrom, LocalDate effectiveTo, Authentication authentication) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        validateCompanyAccess(employee.getCompany().getId(), authentication);

        WorkSchedule schedule = workScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));

        if (!schedule.getCompany().getId().equals(employee.getCompany().getId())) {
            throw new IllegalArgumentException("Schedule and employee must belong to the same company");
        }

        LocalDate from = effectiveFrom != null ? effectiveFrom : LocalDate.now();

        // End any overlapping active assignment
        employeeScheduleRepository.findActiveScheduleForEmployee(employeeId, from)
                .ifPresent(existing -> {
                    existing.setEffectiveTo(from.minusDays(1));
                    employeeScheduleRepository.save(existing);
                });

        EmployeeSchedule assignment = EmployeeSchedule.builder()
                .employee(employee)
                .schedule(schedule)
                .effectiveFrom(from)
                .effectiveTo(effectiveTo)
                .build();

        assignment = employeeScheduleRepository.save(assignment);
        log.info("Assigned schedule '{}' to employee {} effective from {}",
                schedule.getName(), employeeId, assignment.getEffectiveFrom());

        UUID currentUserId = null;
        try {
            currentUserId = keycloakUserService.getCurrentUserId(authentication);
        } catch (Exception ex) {
            // no-op
        }

        activityLogService.logActivity(
            employee.getCompany().getId(),
            currentUserId,
            "SCHEDULE_ASSIGNED",
            "EMPLOYEE_SCHEDULE",
            assignment.getId()
        );

        String actor = authentication != null ? authentication.getName() : "System";
        notificationService.createNotification(
            employee.getCompany().getId(),
            "SCHEDULE_ASSIGNED",
            "Schedule assigned to employee",
            actor + " assigned schedule " + schedule.getName() + " to "
                + employee.getFirstName() + " " + employee.getLastName() + ".",
            "SCHEDULE",
            assignment.getId(),
            "HIGH"
        );

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", assignment.getId());
        response.put("employeeId", employeeId);
        response.put("employeeName", employee.getFirstName() + " " + employee.getLastName());
        response.put("scheduleId", scheduleId);
        response.put("scheduleName", schedule.getName());
        response.put("effectiveFrom", assignment.getEffectiveFrom());
        response.put("effectiveTo", assignment.getEffectiveTo());
        return response;

    }

    @Transactional
    public Map<String, Object> assignScheduleToSubcontractor(UUID subcontractorId, UUID scheduleId,
                                                              LocalDate effectiveFrom, LocalDate effectiveTo,
                                                              Authentication auth) {
        Subcontractor sub = subcontractorRepository.findById(subcontractorId)
                .orElseThrow(() -> new IllegalArgumentException("Subcontractor not found"));
        validateCompanyAccess(sub.getCompany().getId(), auth);

        WorkSchedule schedule = workScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));

        if (!schedule.getCompany().getId().equals(sub.getCompany().getId())) {
            throw new IllegalArgumentException("Schedule and subcontractor must belong to the same company");
        }

        EmployeeSchedule assignment = EmployeeSchedule.builder()
                .subcontractor(sub)
                .schedule(schedule)
                .effectiveFrom(effectiveFrom != null ? effectiveFrom : LocalDate.now())
                .effectiveTo(effectiveTo)
                .build();
        
        assignment = employeeScheduleRepository.save(assignment);
        log.info("Assigned schedule '{}' to subcontractor {} effective from {}",
                schedule.getName(), subcontractorId, assignment.getEffectiveFrom());

        UUID currentUserId = null;
        try {
            currentUserId = keycloakUserService.getCurrentUserId(auth);
        } catch (Exception ex) {
            // no-op
        }

        activityLogService.logActivity(
            sub.getCompany().getId(),
            currentUserId,
            "SCHEDULE_ASSIGNED",
            "SUBCONTRACTOR_SCHEDULE",
            assignment.getId()
        );

        String actor = auth != null ? auth.getName() : "System";
        notificationService.createNotification(
            sub.getCompany().getId(),
            "SCHEDULE_ASSIGNED",
            "Schedule assigned to subcontractor",
            actor + " assigned schedule " + schedule.getName() + " to "
                + resolveSubcontractorName(sub) + ".",
            "SCHEDULE",
            sub.getId(),
            "HIGH"
        );

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", assignment.getId());
        response.put("subcontractorId", subcontractorId);
        response.put("scheduleId", scheduleId);
        response.put("scheduleName", schedule.getName());
        response.put("effectiveFrom", assignment.getEffectiveFrom());
        response.put("effectiveTo", assignment.getEffectiveTo());
        return response;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getEmployeesBySchedule(UUID scheduleId, Authentication auth) {
        WorkSchedule schedule = workScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));
        validateCompanyAccess(schedule.getCompany().getId(), auth);

        return employeeScheduleRepository.findByScheduleId(scheduleId).stream()
                .map(es -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", es.getId());
                    if (es.getEmployee() != null) {
                        m.put("type", "EMPLOYEE");
                        m.put("personId", es.getEmployee().getEmployeeId());
                        m.put("name", es.getEmployee().getFirstName() + " " + es.getEmployee().getLastName());
                    } else if (es.getSubcontractor() != null) {
                        m.put("type", "SUBCONTRACTOR");
                        m.put("personId", es.getSubcontractor().getId());
                        m.put("name", resolveSubcontractorName(es.getSubcontractor()));
                    }
                    m.put("effectiveFrom", es.getEffectiveFrom());
                    m.put("effectiveTo", es.getEffectiveTo());
                    return m;
                })
                .collect(Collectors.toList());
    }

    //schedule lookup(used b attendance service)

    @Transactional(readOnly = true)
    public ScheduleDetail getExpectedScheduleForDate(UUID employeeId , LocalDate date){
        return employeeScheduleRepository.findActiveScheduleForEmployee(employeeId, date)
                .flatMap(assignment -> {
                    String dayName = date.getDayOfWeek().name().toLowerCase();
                    return assignment.getSchedule().getScheduleDetails().stream()
                            .filter(d -> d.getDayOfWeek().equalsIgnoreCase(dayName))
                            .findFirst();
                })
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<UUID> getScheduledEmployeeIdsForDate(UUID companyId, LocalDate date, Authentication authentication) {
        validateCompanyAccess(companyId, authentication);
        return employeeScheduleRepository.findActiveEmployeeIdsByCompanyAndDate(companyId, date);
    }
    
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public com.grh.grh.dto.response.schedule.WorkScheduleResponse getPublicActiveSchedule(String email, String nationalId) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        String normalizedNationalId = nationalId == null ? "" : nationalId.trim();
        com.grh.grh.entity.Employee employee = employeeRepository.findByNationalIdAndEmail(normalizedNationalId, normalizedEmail)
            .orElseThrow(() -> new IllegalArgumentException("No active employee found with this National ID and Email"));
        
        com.grh.grh.entity.EmployeeSchedule assignment = employeeScheduleRepository.findActiveScheduleForEmployee(employee.getEmployeeId(), LocalDate.now())
            .orElseThrow(() -> new IllegalArgumentException("No active schedule found for this employee today"));
        
        return mapToDetailResponse(assignment.getSchedule());
    }

    //helper methods

    private void validateScheduleDetails(List<CreateWorkScheduleRequest.ScheduleDetailRequest> details) {
        Set<String> validDays = Set.of("sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday");
        Set<String> seen = new HashSet<>();
        for (CreateWorkScheduleRequest.ScheduleDetailRequest d : details) {
            String day = d.getDayOfWeek().toLowerCase();
            if (!validDays.contains(day)) {
                throw new IllegalArgumentException("Invalid day of week: " + d.getDayOfWeek());
            }
            if (!seen.add(day)) {
                throw new IllegalArgumentException("Duplicate day of week: " + d.getDayOfWeek());
            }
            if (Boolean.TRUE.equals(d.getIsWorkingDay())) {
                if (d.getStartTime() == null || d.getEndTime() == null) {
                    throw new IllegalArgumentException("Start and end time required for working day: " + day);
                }
                if (!d.getEndTime().isAfter(d.getStartTime())) {
                    throw new IllegalArgumentException("End time must be after start time for: " + day);
                }
            }
        }
    }

    private UUID resolveCompanyId(Authentication auth, UUID requestCompanyId) {
        if (keycloakUserService.isSuperAdmin(auth)) {
            if (requestCompanyId == null)
                throw new IllegalArgumentException("companyId required for super admin");
            return requestCompanyId;
        }
        UUID cid = keycloakUserService.getCurrentUserCompanyId(auth);
        if (cid == null) throw new IllegalStateException("User has no company");
        return cid;
    }

    private void validateCompanyAccess(UUID companyId, Authentication auth) {
        if (keycloakUserService.isSuperAdmin(auth)) return;
        UUID userCid = keycloakUserService.getCurrentUserCompanyId(auth);
        if (userCid == null || !userCid.equals(companyId))
            throw new SecurityException("Access denied");
    }

    private String resolveSubcontractorName(Subcontractor s) {
        if ("COMPANY".equalsIgnoreCase(s.getType()) && s.getCompanyName() != null) return s.getCompanyName();
        String f = s.getContactFirstName() != null ? s.getContactFirstName() : "";
        String l = s.getContactLastName() != null ? s.getContactLastName() : "";
        return (f + " " + l).trim();
    }

    private WorkScheduleListResponse mapToListResponse(WorkSchedule s) {
        long workingDays = s.getScheduleDetails().stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsWorkingDay()))
                .count();
        return WorkScheduleListResponse.builder()
                .id(s.getId())
                .scheduleName(s.getName())
                .description(s.getDescription())
                .isDefault(s.getIsDefault())
                .workingDaysCount((int) workingDays)
                .createdAt(s.getCreatedAt())
                .build();
    }

    private WorkScheduleResponse mapToDetailResponse(WorkSchedule s) {
        List<WorkScheduleResponse.ScheduleDetailResponse> details = s.getScheduleDetails().stream()
                .map(d -> WorkScheduleResponse.ScheduleDetailResponse.builder()
                        .id(d.getId())
                        .dayOfWeek(d.getDayOfWeek())
                        .startTime(d.getWorkStartTime())
                        .endTime(d.getWorkEndTime())
                        .isWorkingDay(d.getIsWorkingDay())
                        .build())
                .sorted(Comparator.comparingInt(d -> dayOrder(d.getDayOfWeek())))
                .collect(Collectors.toList());

        return WorkScheduleResponse.builder()
                .id(s.getId())
                .scheduleName(s.getName())
                .description(s.getDescription())
                .isDefault(s.getIsDefault())
                .companyId(s.getCompany().getId())
                .companyName(s.getCompany().getName())
                .scheduleDetails(details)
                .createdAt(s.getCreatedAt())
                .build();
    }

    private int dayOrder(String day) {
        return switch (day.toLowerCase()) {
            case "sunday" -> 0; case "monday" -> 1; case "tuesday" -> 2;
            case "wednesday" -> 3; case "thursday" -> 4; case "friday" -> 5;
            case "saturday" -> 6; default -> 7;
        };
    }

}
