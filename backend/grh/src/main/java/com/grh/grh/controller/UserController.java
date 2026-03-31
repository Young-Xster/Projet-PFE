package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.user.CreateUserRequest;
import com.grh.grh.dto.request.user.UpdateUserRoleRequest;
import com.grh.grh.dto.response.user.UserResponse;
import com.grh.grh.entity.User;
import com.grh.grh.repository.UserRepository;
import com.grh.grh.service.ActivityLogService;
import com.grh.grh.service.KeycloakAdminService;
import com.grh.grh.service.KeycloakUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;



@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
    
    private final KeycloakAdminService keycloakAdminService;
    private final UserRepository userRepository;
    private final KeycloakUserService keycloakUserService;
    private final ActivityLogService activityLogService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<List<UserResponse>> getUsers(
        @RequestParam(required = false) UUID companyId,
        @RequestParam(required = false) Boolean active
    ) {
        List<User> users = active == null
            ? userRepository.findAll()
            : userRepository.findAllByIsActive(active);

        List<UserResponse> response = users.stream()
            .filter(user -> companyId == null || companyId.equals(user.getCompanyId()))
            .map(this::toUserResponse)
            .collect(Collectors.toList());

        return ApiResponse.success("Users retrieved", response);
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request, Authentication authentication) {
        boolean isSuperAdminRole = request.getRoleName() != null
            && "SUPER_ADMIN".equalsIgnoreCase(request.getRoleName().trim());

        if (!isSuperAdminRole && request.getCompanyId() == null) {
            throw new IllegalArgumentException("Company is required for non-super-admin users");
        }

        String keycloakUserId = keycloakAdminService.createUser(
            request.getUsername(), 
            request.getEmail(), 
            request.getCompanyId()
        );

        if (request.getCompanyId() != null) {
            keycloakAdminService.updateUserCompany(keycloakUserId, request.getCompanyId());
        }
        
        if(request.getRoleName() != null && !request.getRoleName().isBlank()){
            keycloakAdminService.assignRoleToUser(keycloakUserId, request.getRoleName());
        }

        User user = User.builder()
            .keycloakId(keycloakUserId)
            .username(request.getUsername())
            .email(request.getEmail())
            .companyId(request.getCompanyId())
            .isActive(true)
            .isSuperAdmin(isSuperAdminRole)
            .build();
        
        user = userRepository.save(user);

        activityLogService.logActivity(
            request.getCompanyId(),
            resolveCurrentUserId(authentication),
            "USER_CREATED",
            "USER",
            user.getId()
        );

        UserResponse response = toUserResponse(user);
        response.setMessage("User created successfully. Password setup email sent to " + user.getEmail());
        
        return ApiResponse.success("User created and email sent", response);
        
    }

    @PutMapping("/{userId}/role")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<UserResponse> updateUserRole(
        @PathVariable UUID userId,
        @Valid @RequestBody UpdateUserRoleRequest request,
        Authentication authentication
    ) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        keycloakAdminService.replaceUserBusinessRoles(user.getKeycloakId(), request.getRoleName());
        user.setIsSuperAdmin("SUPER_ADMIN".equalsIgnoreCase(request.getRoleName()));
        User saved = userRepository.save(user);

        activityLogService.logActivity(
            saved.getCompanyId(),
            resolveCurrentUserId(authentication),
            "USER_ROLE_UPDATED",
            "USER",
            saved.getId()
        );

        UserResponse response = toUserResponse(saved);
        response.setMessage("User role updated to " + request.getRoleName());
        return ApiResponse.success("User role updated", response);
    }

    @PostMapping("/{userId}/resend-setup-email")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<String> resendSetupEmail(@PathVariable UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        keycloakAdminService.resendPasswordSetupEmail(user.getKeycloakId());

        return ApiResponse.success("Password setup email resent to " + user.getEmail(), null);
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<Void> deleteUser(@PathVariable UUID userId, Authentication authentication) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getKeycloakId() != null && !user.getKeycloakId().isBlank()) {
            keycloakAdminService.deleteUser(user.getKeycloakId());
        }

        userRepository.delete(user);

        activityLogService.logActivity(
            user.getCompanyId(),
            resolveCurrentUserId(authentication),
            "USER_DELETED",
            "USER",
            user.getId()
        );

        return ApiResponse.success("User deleted successfully", null);
    }

    private UserResponse toUserResponse(User user) {
        List<String> roleNames = Collections.emptyList();
        if (user.getKeycloakId() != null && !user.getKeycloakId().isBlank()) {
            try {
                roleNames = keycloakAdminService.getUserRoleNames(user.getKeycloakId());
            } catch (Exception ex) {
                roleNames = Collections.emptyList();
            }
        }

        return UserResponse.builder()
            .id(user.getId())
            .keycloakId(user.getKeycloakId())
            .username(user.getUsername())
            .email(user.getEmail())
            .companyId(user.getCompanyId())
            .isActive(user.getIsActive())
            .isSuperAdmin(user.getIsSuperAdmin())
            .roleNames(roleNames)
            .build();
    }

    private UUID resolveCurrentUserId(Authentication authentication) {
        try {
            return keycloakUserService.getCurrentUserId(authentication);
        } catch (Exception ex) {
            return null;
        }
    }
    
    
}
