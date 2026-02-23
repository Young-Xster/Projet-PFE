package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.performance.CreatePerformanceReviewRequest;
import com.grh.grh.dto.request.performance.UpdatePerformanceReviewRequest;
import com.grh.grh.dto.response.performance.PerformanceReviewResponse;
import com.grh.grh.service.PerformanceReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/performance-reviews")
@RequiredArgsConstructor
public class PerformanceReviewController {
    
    private final PerformanceReviewService performanceReviewService;

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'performance:create')")
    public ApiResponse<PerformanceReviewResponse> createReview(
        @Valid @RequestBody CreatePerformanceReviewRequest request,
        Authentication authentication
    ) {
        return ApiResponse.success("Performance review created",
            performanceReviewService.createReview(request, authentication));
    }

    @PutMapping("/{reviewId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'performance:update')")
    public ApiResponse<PerformanceReviewResponse> updateReview(
        @PathVariable UUID reviewId,
        @Valid @RequestBody UpdatePerformanceReviewRequest request,
        Authentication authentication
    ) {
        return ApiResponse.success("Performance review updated",
            performanceReviewService.updateReview(reviewId, request, authentication));
    }

    @PostMapping("/{reviewId}/acknowledge")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'performance:update')")
    public ApiResponse<PerformanceReviewResponse> acknowledgeReview(
        @PathVariable UUID reviewId,
        @RequestParam UUID acknowledgedByUserId,
        Authentication authentication
    ) {
        return ApiResponse.success("Performance review acknowledged",
            performanceReviewService.acknowledgeReview(reviewId, acknowledgedByUserId, authentication));
    }

    @GetMapping("/{reviewId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'performance:read')")
    public ApiResponse<PerformanceReviewResponse> getReviewById(
        @PathVariable UUID reviewId,
        Authentication authentication
    ) {
        return ApiResponse.success("Performance review retrieved",
            performanceReviewService.getReviewById(reviewId, authentication));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'performance:read')")
    public ApiResponse<List<PerformanceReviewResponse>> getReviewsByEmployee(
        @PathVariable UUID employeeId,
        Authentication authentication
    ) {
        return ApiResponse.success("Performance reviews retrieved",
            performanceReviewService.getReviewsByEmployee(employeeId, authentication));
    }

    @GetMapping("/company/{companyId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'performance:read')")
    public ApiResponse<List<PerformanceReviewResponse>> getReviewsByCompany(
        @PathVariable UUID companyId,
        Authentication authentication
    ) {
        return ApiResponse.success("Performance reviews retrieved",
            performanceReviewService.getReviewsByCompany(companyId, authentication));
    }

    @GetMapping("/company/{companyId}/status/{status}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'performance:read')")
    public ApiResponse<List<PerformanceReviewResponse>> getReviewsByStatus(
        @PathVariable UUID companyId,
        @PathVariable String status,
        Authentication authentication
    ) {
        return ApiResponse.success("Performance reviews retrieved",
            performanceReviewService.getReviewsByCompanyAndStatus(companyId, status, authentication));
    }

    @DeleteMapping("/{reviewId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'performance:delete')")
    public ApiResponse<Void> deleteReview(
        @PathVariable UUID reviewId,
        Authentication authentication
    ) {
        performanceReviewService.deleteReview(reviewId, authentication);
        return ApiResponse.success("Performance review deleted", null);
    }
}
