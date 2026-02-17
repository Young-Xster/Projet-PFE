package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.user.CreateUserRequest;
import com.grh.grh.dto.response.user.UserResponse;
import com.grh.grh.entity.User;
import com.grh.grh.repository.UserRepository;
import com.grh.grh.service.KeycloakAdminService;
import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;



@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
    
    private final KeycloakAdminService keycloakAdminService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<UserResponse> createUser(@RequestBody CreateUserRequest request) {
        String keycloakUserId = keycloakAdminService.createUser(
            request.getUsername(), 
            request.getEmail(), 
            request.getCompanyId()
        );
        
        if(request.getRoleName() != null && !request.getRoleName().isBlank()){
            keycloakAdminService.assignRoleToUser(keycloakUserId, request.getRoleName());
        }

        User user = User.builder()
            .keycloakId(keycloakUserId)
            .username(request.getUsername())
            .email(request.getEmail())
            .companyId(request.getCompanyId())
            .isActive(true)
            .isSuperAdmin(false)
            .build();
        
        user = userRepository.save(user);

        UserResponse response = UserResponse.builder()
            .id(user.getId())
            .keycloakId(keycloakUserId)
            .username(user.getUsername())
            .email(user.getEmail())
            .companyId(user.getCompanyId())
            .isActive(user.getIsActive())
            .isSuperAdmin(user.getIsSuperAdmin())
            .message("User created successfully. Password setup email sent to " + user.getEmail())
            .build();
        
        return ApiResponse.success("User created and email sent", response);
        
    }

    @PostMapping("/{userId}/resend-setup-email")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<String> resendSetupEmail(@PathVariable UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        keycloakAdminService.resendPasswordSetupEmail(user.getKeycloakId());

        return ApiResponse.success("Password setup email resent to " + user.getEmail(), null);
    }
    
    
}
