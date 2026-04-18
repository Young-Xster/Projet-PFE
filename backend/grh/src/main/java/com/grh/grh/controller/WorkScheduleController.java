package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.schedule.CreateWorkScheduleRequest;
import com.grh.grh.dto.request.schedule.UpdateWorkScheduleRequest;
import com.grh.grh.dto.response.schedule.WorkScheduleListResponse;
import com.grh.grh.dto.response.schedule.WorkScheduleResponse;
import com.grh.grh.service.WorkScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/work-schedules")
@RequiredArgsConstructor
public class WorkScheduleController {

    private final WorkScheduleService workScheduleService;

    // ─── Template CRUD ────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'work_schedules:create')")
    public ApiResponse<WorkScheduleResponse> createSchedule(
            @Valid @RequestBody CreateWorkScheduleRequest request,
            Authentication authentication
    ) {
        return ApiResponse.success("Work schedule created",
                workScheduleService.createWorkSchedule(request, authentication));
    }

    @PutMapping("/{scheduleId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'work_schedules:update')")
    public ApiResponse<WorkScheduleResponse> updateSchedule(
            @PathVariable UUID scheduleId,
            @Valid @RequestBody UpdateWorkScheduleRequest request,
            Authentication authentication
    ) {
        return ApiResponse.success("Work schedule updated",
                workScheduleService.updateWorkSchedule(scheduleId, request, authentication));
    }

    @GetMapping("/{scheduleId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'work_schedules:read')")
    public ApiResponse<WorkScheduleResponse> getById(
            @PathVariable UUID scheduleId,
            Authentication authentication
    ) {
        return ApiResponse.success("Schedule retrieved",
                workScheduleService.getScheduleByID(scheduleId, authentication));
    }

    @GetMapping("/company/{companyId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'work_schedules:read')")
    public ApiResponse<List<WorkScheduleListResponse>> getByCompany(
            @PathVariable UUID companyId,
            Authentication authentication
    ) {
        return ApiResponse.success("Schedules retrieved",
                workScheduleService.getSchedulesByCompany(companyId, authentication));
    }

    @DeleteMapping("/{scheduleId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'work_schedules:delete')")
    public ApiResponse<Void> deleteSchedule(
            @PathVariable UUID scheduleId,
            Authentication authentication
    ) {
        workScheduleService.deleteSchedule(scheduleId, authentication);
        return ApiResponse.success("Schedule deleted", null);
    }

    // ─── Employee / Subcontractor Assignment ──────────────────────────────

    @PostMapping("/{scheduleId}/assign/employee/{employeeId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'work_schedules:update')")
    public ApiResponse<Map<String, Object>> assignToEmployee(
            @PathVariable UUID scheduleId,
            @PathVariable UUID employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate effectiveFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate effectiveTo,
            Authentication authentication
    ) {
        return ApiResponse.success("Schedule assigned to employee",
                workScheduleService.assignScheduleToEmployee(employeeId, scheduleId, effectiveFrom, effectiveTo, authentication));
    }

    @PostMapping("/{scheduleId}/assign/subcontractor/{subcontractorId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'work_schedules:update')")
    public ApiResponse<Map<String, Object>> assignToSubcontractor(
            @PathVariable UUID scheduleId,
            @PathVariable UUID subcontractorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate effectiveFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate effectiveTo,
            Authentication authentication
    ) {
        return ApiResponse.success("Schedule assigned to subcontractor",
                workScheduleService.assignScheduleToSubcontractor(subcontractorId, scheduleId, effectiveFrom, effectiveTo, authentication));
    }

    @GetMapping("/{scheduleId}/assignments")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'work_schedules:read')")
    public ApiResponse<List<Map<String, Object>>> getAssignments(
            @PathVariable UUID scheduleId,
            Authentication authentication
    ) {
        return ApiResponse.success("Schedule assignments retrieved",
                workScheduleService.getEmployeesBySchedule(scheduleId, authentication));
    }

    @GetMapping("/company/{companyId}/scheduled-employees")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'work_schedules:read')")
    public ApiResponse<List<UUID>> getScheduledEmployeesForDate(
            @PathVariable UUID companyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication authentication
    ) {
        return ApiResponse.success("Scheduled employees retrieved",
                workScheduleService.getScheduledEmployeeIdsForDate(companyId, date, authentication));
    }
}
