package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.employee.CreateEmployeeRequest;
import com.grh.grh.dto.request.employee.OffboardEmployeeRequest;
import com.grh.grh.dto.request.employee.UpdateEmployeeRequest;
import com.grh.grh.dto.response.employee.EmployeeResponse;
import com.grh.grh.service.EmployeeService;
import com.grh.grh.service.KeycloakUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;
    private final KeycloakUserService keycloakUserService;

    @PostMapping("/public/verify")
    public ApiResponse<java.util.Map<String, String>> verifyEmployeePublic(
        @RequestBody java.util.Map<String, String> request
    ) {
        String email = request.get("email");
        String nationalId = request.get("nationalId");
        if (email == null || nationalId == null) {
            throw new IllegalArgumentException("Email and National ID are required");
        }
        return ApiResponse.success("Employee verified", employeeService.verifyPublicEmployee(email, nationalId));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'employees:create')")
    public ApiResponse<EmployeeResponse> createEmployee(
        @Valid @RequestBody CreateEmployeeRequest request,
        Authentication authentication
    ) {
        EmployeeResponse response = employeeService.createEmployee(request, authentication);
        return ApiResponse.success("Employee created successfully", response);
    }

    @PutMapping("/{employeeId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'employees:update')")
    public ApiResponse<EmployeeResponse> updateEmployee(
        @PathVariable UUID employeeId,
        @Valid @RequestBody UpdateEmployeeRequest request,
        Authentication authentication
    ) {
        EmployeeResponse response = employeeService.updateEmployee(employeeId, request, authentication);
        return ApiResponse.success("Employee updated successfully", response);
    }

    @GetMapping("/{employeeId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'employees:read')")
    public ApiResponse<EmployeeResponse> getEmployeeById(
        @PathVariable UUID employeeId,
        Authentication authentication
    ) {
        EmployeeResponse response = employeeService.getEmployeeById(employeeId, authentication);
        return ApiResponse.success("Employee retrieved successfully", response);
    }

    @GetMapping("/company/{companyId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'employees:read')")
    public ApiResponse<List<EmployeeResponse>> getAllEmployeesByCompany(
        @PathVariable UUID companyId,
        Authentication authentication
    ) {
        List<EmployeeResponse> responses = employeeService.getAllEmployeesByCompany(companyId, authentication);
        return ApiResponse.success("Employees retrieved successfully", responses);
    }

    @GetMapping("/company/{companyId}/include-terminated")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'employees:read')")
    public ApiResponse<List<EmployeeResponse>> getAllEmployeesByCompanyIncludingTerminated(
        @PathVariable UUID companyId,
        Authentication authentication
    ) {
        List<EmployeeResponse> responses = employeeService.getAllEmployeesByCompanyIncludingTerminated(companyId, authentication);
        return ApiResponse.success("Employees retrieved successfully", responses);
    }

    @GetMapping("/department/{departmentId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'employees:read')")
    public ApiResponse<List<EmployeeResponse>> getEmployeesByDepartment(
        @PathVariable UUID departmentId,
        Authentication authentication
    ) {
        List<EmployeeResponse> responses = employeeService.getEmployeesByDepartment(departmentId, authentication);
        return ApiResponse.success("Employees retrieved successfully", responses);
    }

    @DeleteMapping("/{employeeId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'employees:delete')")
    public ApiResponse<Void> deleteEmployee(
        @PathVariable UUID employeeId,
        Authentication authentication
    ) {
        employeeService.deleteEmployee(employeeId, authentication);
        return ApiResponse.success("Employee deleted successfully", null);
    }

    @PatchMapping("/{employeeId}/remove-department")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'employees:update')")
    public ApiResponse<EmployeeResponse> removeEmployeeFromDepartment(
        @PathVariable UUID employeeId,
        Authentication authentication
    ) {
        EmployeeResponse response = employeeService.removeEmployeeFromDepartment(employeeId, authentication);
        return ApiResponse.success("Employee removed from department successfully", response);
    }

    // ─── Offboarding ─────────────────────────────────────────────────────
    @PostMapping("/{employeeId}/offboard")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'employees:update')")
    public ApiResponse<EmployeeResponse> offboardEmployee(
        @PathVariable UUID employeeId,
        @Valid @RequestBody OffboardEmployeeRequest request,
        Authentication authentication
    ) {
        EmployeeResponse response = employeeService.offboardEmployee(employeeId, request, authentication);
        return ApiResponse.success("Employee offboarded successfully", response);
    }
}
