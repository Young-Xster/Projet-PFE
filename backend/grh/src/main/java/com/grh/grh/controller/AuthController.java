package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.auth.RefreshTokenRequest;
import com.grh.grh.dto.response.auth.TokenResponse;
import com.grh.grh.dto.response.auth.UserContextResponse;
import com.grh.grh.entity.Company;
import com.grh.grh.entity.User;
import com.grh.grh.repository.CompanyRepository;
import com.grh.grh.service.KeycloakUserService;
import com.grh.grh.service.TokenService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final KeycloakUserService keycloakUserService;
    private final CompanyRepository companyRepository;
    private final TokenService tokenService;
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

            List<String> permissions = keycloakUserService.extractPermissions(authentication);
            
            response.setCompanyContext(UserContextResponse.CompanyContext.builder()
                .companyId(company.getId())
                .companyName(company.getName())
                .companyCode(company.getCode())
                .permissions(permissions)
                .build());
        }

        return ApiResponse.success("User context retrieved", response);
    }

    @PostMapping("/refresh")
    public ApiResponse<TokenResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        Map<String, Object> tokenData = tokenService.refreshAccessToken(request.getRefreshToken());
        
        TokenResponse response = TokenResponse.builder()
            .accessToken((String) tokenData.get("access_token"))
            .refreshToken((String) tokenData.get("refresh_token"))
            .expiresIn((Integer) tokenData.get("expires_in"))
            .refreshExpiresIn((Integer) tokenData.get("refresh_expires_in"))
            .tokenType((String) tokenData.get("token_type"))
            .build();
        
        return ApiResponse.success("Token refreshed successfully", response);
    }

    @PostMapping("/logout")
    public ApiResponse<String> logout(@Valid @RequestBody RefreshTokenRequest request) {
        tokenService.revokeRefreshToken(request.getRefreshToken());
        return ApiResponse.success("Logged out successfully", null);
    }
}