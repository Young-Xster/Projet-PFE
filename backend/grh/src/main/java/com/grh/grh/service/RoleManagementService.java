package com.grh.grh.service;

import com.grh.grh.dto.request.permission.CreateRoleRequest;
import com.grh.grh.dto.request.permission.UpdateRolePermissionsRequest;
import com.grh.grh.dto.response.permission.PermissionListResponse;
import com.grh.grh.dto.response.permission.RoleAvailabilityResponse;
import com.grh.grh.dto.response.permission.RoleResponse;
import com.grh.grh.enums.PermissionAction;
import com.grh.grh.enums.PermissionModule;
import lombok.RequiredArgsConstructor;
import org.keycloak.representations.idm.RoleRepresentation;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleManagementService {

    private static final Set<String> SYSTEM_ROLES = Set.of(
        "offline_access",
        "uma_authorization"
    );

    private final KeycloakAdminService keycloakAdminService;

    public RoleResponse createRole(CreateRoleRequest request) {
        String roleName = normalizeRoleName(request.getRoleName());
        if (!isRoleNameAvailable(roleName).isAvailable()) {
            throw new IllegalStateException("Role name already exists");
        }

        List<String> normalizedPermissions = normalizeAndValidatePermissions(request.getPermissions());
        Map<String, List<String>> grouped = groupPermissions(normalizedPermissions);

        keycloakAdminService.createRole(
            roleName,
            request.getDescription() != null ? request.getDescription().trim() : null,
            grouped
        );

        return getRole(roleName);
    }

    public List<RoleResponse> getRoles() {
        return keycloakAdminService.getAllRoles().stream()
            .filter(this::isBusinessRole)
            .map(this::mapRole)
            .sorted(Comparator.comparing(RoleResponse::getRoleName, String.CASE_INSENSITIVE_ORDER))
            .collect(Collectors.toList());
    }

    public RoleResponse getRole(String roleName) {
        RoleRepresentation role = keycloakAdminService.getRoleWithPermissions(roleName);
        if (role == null) {
            throw new IllegalArgumentException("Role not found");
        }
        return mapRole(role);
    }

    public RoleResponse updateRolePermissions(String roleName, UpdateRolePermissionsRequest request) {
        List<String> normalizedPermissions = normalizeAndValidatePermissions(request.getPermissions());
        Map<String, List<String>> grouped = groupPermissions(normalizedPermissions);
        keycloakAdminService.updateRolePermissions(roleName, grouped);
        return getRole(roleName);
    }

    public void deleteRole(String roleName) {
        if (!isBusinessRoleName(roleName)) {
            throw new IllegalArgumentException("System role cannot be deleted");
        }
        keycloakAdminService.deleteRole(roleName);
    }

    public RoleAvailabilityResponse isRoleNameAvailable(String roleName) {
        String normalized = normalizeRoleName(roleName);
        boolean exists = keycloakAdminService.getAllRoles().stream()
            .map(RoleRepresentation::getName)
            .anyMatch(existing -> existing != null && existing.equalsIgnoreCase(normalized));

        return RoleAvailabilityResponse.builder()
            .roleName(normalized)
            .available(!exists)
            .build();
    }

    public PermissionListResponse getPermissionCatalog() {
        List<PermissionListResponse.ModulePermissions> modules = Arrays.stream(PermissionModule.values())
            .map(module -> PermissionListResponse.ModulePermissions.builder()
                .moduleName(module.getCode())
                .displayName(module.getDisplayName())
                .actions(Arrays.stream(PermissionAction.values())
                    .map(action -> PermissionListResponse.PermissionOption.builder()
                        .id(null)
                        .name(module.getCode() + ":" + action.getCode())
                        .action(action.getCode())
                        .displayName(action.getDisplayName())
                        .description("Allow " + action.getDisplayName() + " on " + module.getDisplayName())
                        .enabled(false)
                        .build())
                    .collect(Collectors.toList()))
                .build())
            .collect(Collectors.toList());

        return PermissionListResponse.builder()
            .modules(modules)
            .build();
    }

    private RoleResponse mapRole(RoleRepresentation role) {
        List<String> permissions = Optional.ofNullable(role.getAttributes())
            .map(attributes -> attributes.get("permissions"))
            .orElse(Collections.emptyList())
            .stream()
            .filter(Objects::nonNull)
            .map(String::trim)
            .filter(value -> !value.isBlank())
            .sorted(String.CASE_INSENSITIVE_ORDER)
            .collect(Collectors.toList());

        return RoleResponse.builder()
            .roleName(role.getName())
            .description(role.getDescription())
            .permissions(permissions)
            .build();
    }

    private List<String> normalizeAndValidatePermissions(List<String> permissions) {
        Set<String> valid = Arrays.stream(PermissionModule.values())
            .flatMap(module -> Arrays.stream(PermissionAction.values())
                .map(action -> module.getCode() + ":" + action.getCode()))
            .collect(Collectors.toSet());

        List<String> normalized = permissions.stream()
            .filter(Objects::nonNull)
            .map(String::trim)
            .map(String::toLowerCase)
            .distinct()
            .collect(Collectors.toList());

        List<String> invalid = normalized.stream()
            .filter(permission -> !valid.contains(permission))
            .collect(Collectors.toList());

        if (!invalid.isEmpty()) {
            throw new IllegalArgumentException("Invalid permissions: " + String.join(", ", invalid));
        }

        return normalized;
    }

    private Map<String, List<String>> groupPermissions(List<String> permissions) {
        Map<String, List<String>> grouped = new HashMap<>();
        for (String permission : permissions) {
            String[] parts = permission.split(":", 2);
            grouped.computeIfAbsent(parts[0], ignored -> new ArrayList<>()).add(parts[1]);
        }
        return grouped;
    }

    private String normalizeRoleName(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            throw new IllegalArgumentException("Role name is required");
        }
        return roleName.trim();
    }

    private boolean isBusinessRole(RoleRepresentation role) {
        return role != null && isBusinessRoleName(role.getName());
    }

    private boolean isBusinessRoleName(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            return false;
        }
        String lower = roleName.toLowerCase(Locale.ROOT);
        if (SYSTEM_ROLES.contains(lower)) {
            return false;
        }
        return !lower.startsWith("default-roles-");
    }
}
