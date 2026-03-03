package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.recruitment.CreateInterviewStageRequest;
import com.grh.grh.dto.response.recruitment.InterviewStageResponse;
import com.grh.grh.service.InterviewStageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/interview-stages")
@RequiredArgsConstructor
public class InterviewStageController {

    private final InterviewStageService interviewStageService;

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'interview_stages:create')")
    public ApiResponse<InterviewStageResponse> create(
            @Valid @RequestBody CreateInterviewStageRequest request,
            Authentication authentication) {
        return ApiResponse.success("Interview stage created",
                interviewStageService.create(request, authentication));
    }

    @GetMapping("/{stageId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'interview_stages:read')")
    public ApiResponse<InterviewStageResponse> getById(
            @PathVariable UUID stageId, Authentication authentication) {
        return ApiResponse.success("Interview stage retrieved",
                interviewStageService.getById(stageId, authentication));
    }

    @GetMapping("/candidate/{candidateId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'interview_stages:read')")
    public ApiResponse<List<InterviewStageResponse>> getByCandidate(
            @PathVariable UUID candidateId, Authentication authentication) {
        return ApiResponse.success("Interview stages retrieved",
                interviewStageService.getByCandidate(candidateId, authentication));
    }

    @GetMapping("/company/{companyId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'interview_stages:read')")
    public ApiResponse<List<InterviewStageResponse>> getByCompany(
            @PathVariable UUID companyId, Authentication authentication) {
        return ApiResponse.success("Interview stages retrieved",
                interviewStageService.getByCompany(companyId, authentication));
    }

    @GetMapping("/upcoming")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'interview_stages:read')")
    public ApiResponse<List<InterviewStageResponse>> getUpcoming(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
            Authentication authentication) {
        return ApiResponse.success("Upcoming interviews retrieved",
                interviewStageService.getUpcoming(from, to, authentication));
    }

    @PutMapping("/{stageId}/status")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'interview_stages:update')")
    public ApiResponse<InterviewStageResponse> updateStatus(
            @PathVariable UUID stageId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String feedback,
            @RequestParam(required = false) Integer rating,
            Authentication authentication) {
        return ApiResponse.success("Interview stage updated",
                interviewStageService.updateStatus(stageId, status, feedback, rating, authentication));
    }

    @PutMapping("/{stageId}/reschedule")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'interview_stages:update')")
    public ApiResponse<InterviewStageResponse> reschedule(
            @PathVariable UUID stageId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime newDate,
            Authentication authentication) {
        return ApiResponse.success("Interview rescheduled",
                interviewStageService.reschedule(stageId, newDate, authentication));
    }

    @DeleteMapping("/{stageId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'interview_stages:delete')")
    public ApiResponse<Void> delete(
            @PathVariable UUID stageId, Authentication authentication) {
        interviewStageService.delete(stageId, authentication);
        return ApiResponse.success("Interview stage deleted", null);
    }
}