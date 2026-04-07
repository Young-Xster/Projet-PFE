package com.grh.grh.controller;


import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.recruitment.CreateJobListingRequest;
import com.grh.grh.dto.request.recruitment.UpdateJobListingRequest;
import com.grh.grh.dto.response.recruitment.JobListingResponse;
import com.grh.grh.service.JobListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/job-listings")
@RequiredArgsConstructor
public class JobListingController {
    private final JobListingService jobListingService;

    @GetMapping("/public")
    public ApiResponse<List<JobListingResponse>> getPublicListings(
        @RequestParam(required = false) UUID companyId,
        @RequestParam(required = false) UUID departmentId
    ) {
        return ApiResponse.success("Job listings retrieved",
            jobListingService.getPublicListings(companyId, departmentId));
    }

    @GetMapping("/public/{listingId}")
    public ApiResponse<JobListingResponse> getPublicListingById(@PathVariable UUID listingId) {
        return ApiResponse.success("Job listing retrieved",
            jobListingService.getPublicListingById(listingId));
    }

    //HR endpoints
    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment_requests:create')")
    public ApiResponse<JobListingResponse> createListing(
        @Valid @RequestBody CreateJobListingRequest request,
        Authentication authentication
    ) {
        return ApiResponse.success("Job listing created",
            jobListingService.createListing(request, authentication));
    }

    @PutMapping("/{listingId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment_requests:update')")
    public ApiResponse<JobListingResponse> updateListing(
        @PathVariable UUID listingId,
        @Valid @RequestBody UpdateJobListingRequest request,
        Authentication authentication
    ) {
        return ApiResponse.success("Job listing updated",
            jobListingService.updateListing(listingId, request, authentication));
    }

    @PostMapping("/{listingId}/close")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment_requests:update')")
    public ApiResponse<JobListingResponse> closeListing(
        @PathVariable UUID listingId,
        Authentication authentication
    ) {
        return ApiResponse.success("Job listing closed",
            jobListingService.closeListing(listingId, authentication));
    }

    @GetMapping("/my-company")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment_requests:read')")
    public ApiResponse<List<JobListingResponse>> getMyCompanyListings(
        Authentication authentication
    ) {
        return ApiResponse.success("Job listings retrieved",
            jobListingService.getMyCompanyListings(authentication));
    }

    @GetMapping("/company/{companyId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment_requests:read')")
    public ApiResponse<List<JobListingResponse>> getListingsByCompany(
        @PathVariable UUID companyId,
        Authentication authentication
    ) {
        return ApiResponse.success("Job listings retrieved",
            jobListingService.getListingsByCompany(companyId, authentication));
    }

    @GetMapping("/{listingId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment_requests:read')")
    public ApiResponse<JobListingResponse> getListingById(
        @PathVariable UUID listingId,
        Authentication authentication
    ) {
        return ApiResponse.success("Job listing retrieved",
            jobListingService.getListingById(listingId, authentication));
    }

    @DeleteMapping("/{listingId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment_requests:delete')")
    public ApiResponse<Void> deleteListing(
        @PathVariable UUID listingId,
        Authentication authentication
    ) {
        jobListingService.deleteListing(listingId, authentication);
        return ApiResponse.success("Job listing deleted", null);
    }
}
