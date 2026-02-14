package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.entity.User;
import com.grh.grh.service.KeycloakUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final KeycloakUserService keycloakUserService;

    @GetMapping("/me")
    public ApiResponse<User> getCurrentUser(Authentication authentication) {
        User user = keycloakUserService.syncUserFromKeycloak(authentication);
        return ApiResponse.success("User retrieved successfully", user);
    }

    @GetMapping("/super-admin/test")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<String> testSuperAdmin() {
        return ApiResponse.success("Super admin access granted", "You have super admin privileges!");
    }

    @GetMapping("/company-admin/test")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')")
    public ApiResponse<String> testCompanyAdmin() {
        return ApiResponse.success("Company admin access granted", "You have company admin privileges!");
    }
}