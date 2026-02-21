package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.leave.CreateLeaveTypeRequest;
import com.grh.grh.dto.request.leave.UpdateLeaveTypeRequest;
import com.grh.grh.dto.response.leave.LeaveTypeResponse;
import com.grh.grh.service.KeycloakUserService;
import com.grh.grh.service.LeaveTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;


@RestController
@RequestMapping("/api/v1/leave-types")
@RequiredArgsConstructor
public class LeaveTypeController {
    private final LeaveTypeService leaveTypeService;
    private final KeycloakUserService keycloakUserService;

    // ─── PUBLIC (Employee portal: fetch available leave types without auth) ─────
    @GetMapping("/public/company/{companyId}")
    public ApiResponse<List<LeaveTypeResponse>> getLeaveTypesPublic(
        @PathVariable UUID companyId
    ) {
        return ApiResponse.success("Leave types retrieved",
            leaveTypeService.getLeaveTypesByCompanyPublic(companyId));
    }

    // ─── HR ENDPOINTS ─────────────────────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'leave_types:create')")
    public ApiResponse<LeaveTypeResponse> createLeaveType(
        @Valid @RequestBody CreateLeaveTypeRequest request,
        Authentication authentication
    ) {
        return ApiResponse.success("Leave type created successfully",
            leaveTypeService.createLeaveType(request, authentication));
    }

    @PutMapping("/{leaveTypeId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'leave_types:update')")
    public ApiResponse<LeaveTypeResponse> updateLeaveType(
        @PathVariable UUID leaveTypeId,
        @Valid @RequestBody UpdateLeaveTypeRequest request,
        Authentication authentication
    ){
        return ApiResponse.success("Leave type updated successfully",
            leaveTypeService.updateLeaveType(leaveTypeId, request, authentication));
    }

    @GetMapping("/{leaveTypeId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'leave_types:read')")
    public ApiResponse<LeaveTypeResponse> getLeaveTypeById(
        @PathVariable UUID leaveTypeId,
        Authentication authentication
    ) {
        return ApiResponse.success("Leave type retrieved successfully",
            leaveTypeService.getLeaveTypeById(leaveTypeId, authentication));
    }

    @GetMapping("/company/{companyId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'leave_types:read')")
    public ApiResponse<List<LeaveTypeResponse>> getLeaveTypesByCompany(
        @PathVariable UUID companyId,
        Authentication authentication
    ) {
        return ApiResponse.success("Leave types retrieved successfully",
            leaveTypeService.getLeaveTypesByCompany(companyId, authentication));
    }

    @DeleteMapping("/{leaveTypeId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'leave_types:delete')")
    public ApiResponse<Void> deleteLeaveType(
        @PathVariable UUID leaveTypeId,
        Authentication authentication
    ) {
        leaveTypeService.deleteLeaveType(leaveTypeId, authentication);
        return ApiResponse.success("Leave type deleted successfully", null);
    }

    

    
}
