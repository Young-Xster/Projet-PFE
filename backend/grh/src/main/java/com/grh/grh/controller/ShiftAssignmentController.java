package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.shift.CreateShiftAssignmentRequest;
import com.grh.grh.dto.request.shift.UpdateShiftAssignmentRequest;
import com.grh.grh.dto.response.shift.ShiftAssignmentResponse;
import com.grh.grh.service.ShiftAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/shifts")
@RequiredArgsConstructor
public class ShiftAssignmentController {

    private final ShiftAssignmentService shiftAssignmentService;

    // ─── Manual CRUD ──────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'shift_assignments:create')")
    public ApiResponse<ShiftAssignmentResponse> createShift(
            @Valid @RequestBody CreateShiftAssignmentRequest request,
            Authentication authentication
    ) {
        return ApiResponse.success("Shift created",
                shiftAssignmentService.createShift(request, authentication));
    }

    @PutMapping("/{shiftId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'shift_assignments:update')")
    public ApiResponse<ShiftAssignmentResponse> updateShift(
            @PathVariable UUID shiftId,
            @Valid @RequestBody UpdateShiftAssignmentRequest request,
            Authentication authentication
    ) {
        return ApiResponse.success("Shift updated",
                shiftAssignmentService.updateShift(shiftId, request, authentication));
    }

    @PostMapping("/{shiftId}/cancel")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'shift_assignments:update')")
    public ApiResponse<Void> cancelShift(
            @PathVariable UUID shiftId, Authentication authentication
    ) {
        shiftAssignmentService.cancelShift(shiftId, authentication);
        return ApiResponse.success("Shift cancelled", null);
    }

    // ─── Auto-generate ────────────────────────────────────────────────────

    @PostMapping("/generate/{scheduleId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'shift_assignments:create')")
    public ApiResponse<List<ShiftAssignmentResponse>> generateShifts(
            @PathVariable UUID scheduleId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            Authentication authentication
    ) {
        return ApiResponse.success("Shifts generated",
                shiftAssignmentService.generateShifts(scheduleId, fromDate, toDate, authentication));
    }

    // ─── Queries ──────────────────────────────────────────────────────────

    @GetMapping("/{shiftId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'shift_assignments:read')")
    public ApiResponse<ShiftAssignmentResponse> getById(
            @PathVariable UUID shiftId, Authentication authentication
    ) {
        return ApiResponse.success("Shift retrieved",
                shiftAssignmentService.getShiftById(shiftId, authentication));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'shift_assignments:read')")
    public ApiResponse<List<ShiftAssignmentResponse>> getByEmployeeAndRange(
            @PathVariable UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication
    ) {
        return ApiResponse.success("Shifts retrieved",
                shiftAssignmentService.getShiftsByEmployeeAndRange(employeeId, startDate, endDate, authentication));
    }

    @GetMapping("/company/{companyId}/date/{date}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'shift_assignments:read')")
    public ApiResponse<List<ShiftAssignmentResponse>> getByDate(
            @PathVariable UUID companyId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication authentication
    ) {
        return ApiResponse.success("Shifts retrieved",
                shiftAssignmentService.getShiftsByDate(date, companyId, authentication));
    }
}