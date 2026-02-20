package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.department.CreateDepartmentRequest;
import com.grh.grh.dto.request.department.UpdateDepartmentRequest;
import com.grh.grh.dto.response.department.DepartmentResponse;
import com.grh.grh.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;



@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
public class DepartmentController {
    
    private final DepartmentService departmentService;

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'departments:create')")
    public ApiResponse<DepartmentResponse> createDepartment(
        @Valid @RequestBody CreateDepartmentRequest request,
        Authentication authentication
    ) {
        return ApiResponse.success("Department created successfully",
            departmentService.createDepartment(request, authentication));
    }

    @PutMapping("/{departmentId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'departments:update')")
    public ApiResponse<DepartmentResponse> updateDepartment(
        @PathVariable UUID departmentId,
        @Valid @RequestBody UpdateDepartmentRequest request,
        Authentication authentication
    ) {
        return ApiResponse.success("Department updated successfully",
            departmentService.updateDepartment(departmentId, request, authentication));
    }

    @GetMapping("/{departmentId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'departments:read')")
    public ApiResponse<DepartmentResponse> getDepartmentById(
        @PathVariable UUID departmentId,
        Authentication authentication
    ) {
        return ApiResponse.success("Department retrieved successfully",
            departmentService.getDepartmentById(departmentId, authentication));
    }

    @GetMapping("/company/{companyId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'departments:read')")
    public ApiResponse<List<DepartmentResponse>> getDepartmentsByCompany(
        @PathVariable UUID companyId,
        Authentication authentication
    ) {
        return ApiResponse.success("Departments retrieved successfully",
            departmentService.getDepartmentsByCompany(companyId, authentication));
    }

    @GetMapping("/{departmentId}/sub-departments")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'departments:read')")
    public ApiResponse<List<DepartmentResponse>> getSubDepartments(
        @PathVariable UUID departmentId,
        Authentication authentication
    ) {
        return ApiResponse.success("Sub-departments retrieved successfully",
            departmentService.getSubDepartments(departmentId, authentication));
    }

    @DeleteMapping("/{departmentId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'departments:delete')")
    public ApiResponse<Void> deleteDepartment(
        @PathVariable UUID departmentId,
        Authentication authentication
    ) {
        departmentService.deleteDepartment(departmentId, authentication);
        return ApiResponse.success("Department deleted successfully", null);
    }
    
}
