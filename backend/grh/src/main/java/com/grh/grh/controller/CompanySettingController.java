package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.settings.UpdateCompanySettingRequest;
import com.grh.grh.dto.response.settings.CompanySettingResponse;
import com.grh.grh.service.CompanySettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/companies/{companyId}/settings")
@RequiredArgsConstructor
public class CompanySettingController {

    private final CompanySettingService companySettingService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'settings:read')")
    public ApiResponse<CompanySettingResponse> getSettings(
            @PathVariable UUID companyId,
            Authentication authentication) {
        return ApiResponse.success("Settings retrieved successfully",
                companySettingService.getSettings(companyId, authentication));
    }

    @PutMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'settings:update')")
    public ApiResponse<CompanySettingResponse> updateSettings(
            @PathVariable UUID companyId,
            @Valid @RequestBody UpdateCompanySettingRequest request,
            Authentication authentication) {
        return ApiResponse.success("Settings updated successfully",
                companySettingService.updateSettings(companyId, request, authentication));
    }
}
