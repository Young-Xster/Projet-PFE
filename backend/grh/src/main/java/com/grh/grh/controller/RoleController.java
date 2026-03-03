package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.permission.CreateRoleRequest;
import com.grh.grh.dto.request.permission.UpdateRolePermissionsRequest;
import com.grh.grh.dto.response.permission.PermissionListResponse;
import com.grh.grh.dto.response.permission.RoleAvailabilityResponse;
import com.grh.grh.dto.response.permission.RoleResponse;
import com.grh.grh.service.RoleManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleManagementService roleManagementService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'roles:read')")
    public ApiResponse<List<RoleResponse>> getRoles() {
        return ApiResponse.success("Roles retrieved", roleManagementService.getRoles());
    }

    @GetMapping("/{roleName}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'roles:read')")
    public ApiResponse<RoleResponse> getRole(@PathVariable String roleName) {
        return ApiResponse.success("Role retrieved", roleManagementService.getRole(roleName));
    }

    @GetMapping("/check-name")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'roles:read')")
    public ApiResponse<RoleAvailabilityResponse> checkRoleNameAvailability(@RequestParam String name) {
        return ApiResponse.success("Role name availability retrieved", roleManagementService.isRoleNameAvailable(name));
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'permissions:read') or @keycloakUserService.hasPermission(authentication, 'roles:read')")
    public ApiResponse<PermissionListResponse> getPermissionCatalog() {
        return ApiResponse.success("Permission catalog retrieved", roleManagementService.getPermissionCatalog());
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'roles:create')")
    public ApiResponse<RoleResponse> createRole(@Valid @RequestBody CreateRoleRequest request) {
        return ApiResponse.success("Role created", roleManagementService.createRole(request));
    }

    @PutMapping("/{roleName}/permissions")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'roles:update')")
    public ApiResponse<RoleResponse> updateRolePermissions(
        @PathVariable String roleName,
        @Valid @RequestBody UpdateRolePermissionsRequest request
    ) {
        return ApiResponse.success("Role permissions updated", roleManagementService.updateRolePermissions(roleName, request));
    }

    @DeleteMapping("/{roleName}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'roles:delete')")
    public ApiResponse<Void> deleteRole(@PathVariable String roleName) {
        roleManagementService.deleteRole(roleName);
        return ApiResponse.success("Role deleted", null);
    }
}
