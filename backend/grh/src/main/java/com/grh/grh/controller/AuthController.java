package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.response.auth.UserContextResponse;
import com.grh.grh.entity.Company;
import com.grh.grh.entity.User;
import com.grh.grh.repository.CompanyRepository;
import com.grh.grh.service.KeycloakUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final KeycloakUserService keycloakUserService;
    private final CompanyRepository companyRepository;

    @GetMapping("/me")
    public ApiResponse<UserContextResponse> getCurrentUser(Authentication authentication) {
        User user = keycloakUserService.syncUserFromKeycloak(authentication);
        
        UserContextResponse response = UserContextResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .isActive(user.getIsActive())
            .isSuperAdmin(user.getIsSuperAdmin())
            .lastLogin(user.getLastLogin())
            .build();

        // If normal user, attach company context
        if (!user.getIsSuperAdmin() && user.getCompanyId() != null) {
            Company company = companyRepository.findById(user.getCompanyId())
                .orElseThrow(() -> new RuntimeException("Company not found"));
            
            response.setCompanyContext(UserContextResponse.CompanyContext.builder()
                .companyId(company.getId())
                .companyName(company.getName())
                .companyCode(company.getCode())
                .build());
        }

        return ApiResponse.success("User context retrieved", response);
    }
}