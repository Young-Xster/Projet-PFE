package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.recruitment.CreateRecruitmentRequestRequest;
import com.grh.grh.dto.response.recruitment.RecruitmentRequestResponse;
import com.grh.grh.service.RecruitmentRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/recruitment-requests")
@RequiredArgsConstructor
public class RecruitmentRequestController {

    private final RecruitmentRequestService recruitmentRequestService;

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment_requests:create')")
    public ApiResponse<RecruitmentRequestResponse> create(
            @Valid @RequestBody CreateRecruitmentRequestRequest request,
            Authentication authentication) {
        return ApiResponse.success("Recruitment request created",
                recruitmentRequestService.create(request, authentication));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment_requests:read')")
    public ApiResponse<RecruitmentRequestResponse> getById(
            @PathVariable UUID id, Authentication authentication) {
        return ApiResponse.success("Recruitment request retrieved",
                recruitmentRequestService.getById(id, authentication));
    }

    @GetMapping("/company/{companyId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment_requests:read')")
    public ApiResponse<List<RecruitmentRequestResponse>> getByCompany(
            @PathVariable UUID companyId, Authentication authentication) {
        return ApiResponse.success("Recruitment requests retrieved",
                recruitmentRequestService.getByCompany(companyId, authentication));
    }

    @GetMapping("/company/{companyId}/status/{status}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment_requests:read')")
    public ApiResponse<List<RecruitmentRequestResponse>> getByStatus(
            @PathVariable UUID companyId, @PathVariable String status,
            Authentication authentication) {
        return ApiResponse.success("Recruitment requests retrieved",
                recruitmentRequestService.getByCompanyAndStatus(companyId, status, authentication));
    }

    @GetMapping("/department/{departmentId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment_requests:read')")
    public ApiResponse<List<RecruitmentRequestResponse>> getByDepartment(
            @PathVariable UUID departmentId, Authentication authentication) {
        return ApiResponse.success("Recruitment requests retrieved",
                recruitmentRequestService.getByDepartment(departmentId, authentication));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment_requests:approve')")
    public ApiResponse<RecruitmentRequestResponse> approve(
            @PathVariable UUID id, Authentication authentication) {
        return ApiResponse.success("Recruitment request approved",
                recruitmentRequestService.approve(id, authentication));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment_requests:approve')")
    public ApiResponse<RecruitmentRequestResponse> reject(
            @PathVariable UUID id, Authentication authentication) {
        return ApiResponse.success("Recruitment request rejected",
                recruitmentRequestService.reject(id, authentication));
    }

    @PostMapping("/{id}/mark-filled")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment_requests:update')")
    public ApiResponse<RecruitmentRequestResponse> markFilled(
            @PathVariable UUID id, Authentication authentication) {
        return ApiResponse.success("Recruitment request marked as filled",
                recruitmentRequestService.markFilled(id, authentication));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment_requests:delete')")
    public ApiResponse<Void> delete(
            @PathVariable UUID id, Authentication authentication) {
        recruitmentRequestService.delete(id, authentication);
        return ApiResponse.success("Recruitment request deleted", null);
    }
}