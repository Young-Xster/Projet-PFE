package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.permission.CreateRoleRequest;
import com.grh.grh.dto.request.permission.UpdateRolePermissionsRequest;
import com.grh.grh.dto.response.permission.PermissionListResponse;
import com.grh.grh.dto.response.permission.RoleAvailabilityResponse;
import com.grh.grh.dto.response.permission.RoleResponse;
import com.grh.grh.service.ActivityLogService;
import com.grh.grh.service.KeycloakUserService;
import com.grh.grh.service.RoleManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleManagementService roleManagementService;
    private final ActivityLogService activityLogService;
    private final KeycloakUserService keycloakUserService;

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
    public ApiResponse<RoleResponse> createRole(@Valid @RequestBody CreateRoleRequest request, Authentication authentication) {
        RoleResponse response = roleManagementService.createRole(request);
        activityLogService.logActivity(
            resolveCurrentCompanyId(authentication),
            resolveCurrentUserId(authentication),
            "ROLE_CREATED",
            "ROLE",
            null
        );
        return ApiResponse.success("Role created", response);
    }

    @PutMapping("/{roleName}/permissions")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'roles:update')")
    public ApiResponse<RoleResponse> updateRolePermissions(
        @PathVariable String roleName,
        @Valid @RequestBody UpdateRolePermissionsRequest request,
        Authentication authentication
    ) {
        RoleResponse response = roleManagementService.updateRolePermissions(roleName, request);
        activityLogService.logActivity(
            resolveCurrentCompanyId(authentication),
            resolveCurrentUserId(authentication),
            "ROLE_PERMISSIONS_UPDATED",
            "ROLE",
            null
        );
        return ApiResponse.success("Role permissions updated", response);
    }

    @DeleteMapping("/{roleName}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'roles:delete')")
    public ApiResponse<Void> deleteRole(@PathVariable String roleName, Authentication authentication) {
        roleManagementService.deleteRole(roleName);
        activityLogService.logActivity(
            resolveCurrentCompanyId(authentication),
            resolveCurrentUserId(authentication),
            "ROLE_DELETED",
            "ROLE",
            null
        );
        return ApiResponse.success("Role deleted", null);
    }

    private UUID resolveCurrentCompanyId(Authentication authentication) {
        try {
            return keycloakUserService.getCurrentUserCompanyId(authentication);
        } catch (Exception ex) {
            return null;
        }
    }

    private UUID resolveCurrentUserId(Authentication authentication) {
        try {
            return keycloakUserService.getCurrentUserId(authentication);
        } catch (Exception ex) {
            return null;
        }
    }
}
