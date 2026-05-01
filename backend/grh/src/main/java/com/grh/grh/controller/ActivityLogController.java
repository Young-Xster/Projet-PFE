package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/activity-logs")
@RequiredArgsConstructor
public class ActivityLogController {
    private final ActivityLogService activityLogService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<List<Map<String, Object>>> getAll(Authentication authentication) {
        return ApiResponse.success("Activity logs retrieved", activityLogService.getAll(authentication));
    }

    @GetMapping("/range")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<List<Map<String, Object>>> getAllByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {
        return ApiResponse.success("Activity logs retrieved",
                activityLogService.getAllByDateRange(startDate, endDate, authentication));
    }


    @GetMapping("/company/{companyId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'activity_logs:read')")
    public ApiResponse<List<Map<String, Object>>> getByCompany(
            @PathVariable UUID companyId, Authentication authentication) {
        return ApiResponse.success("Activity logs retrieved",
                activityLogService.getByCompany(companyId, authentication));
    }

    @GetMapping("/company/{companyId}/range")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'activity_logs:read')")
    public ApiResponse<List<Map<String, Object>>> getByCompanyAndRange(
            @PathVariable UUID companyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {
        return ApiResponse.success("Activity logs retrieved",
                activityLogService.getByCompanyAndDateRange(companyId, startDate, endDate, authentication));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'activity_logs:read')")
    public ApiResponse<List<Map<String, Object>>> getByUser(
            @PathVariable UUID userId, Authentication authentication) {
        return ApiResponse.success("User activity retrieved",
                activityLogService.getByUser(userId, authentication));
    }

    @GetMapping("/entity/{entityId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'activity_logs:read')")
    public ApiResponse<List<Map<String, Object>>> getByEntity(
            @PathVariable UUID entityId, Authentication authentication) {
        return ApiResponse.success("Entity history retrieved",
                activityLogService.getByEntity(entityId, authentication));
    }
}
