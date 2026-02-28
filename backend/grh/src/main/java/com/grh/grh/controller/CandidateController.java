package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.recruitment.CandidateApplicationRequest;
import com.grh.grh.dto.request.recruitment.CandidateNotesRequest;
import com.grh.grh.dto.request.recruitment.HireCandidateRequest;
import com.grh.grh.dto.response.recruitment.CandidateResponse;
import com.grh.grh.service.CandidateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/candidates")
@RequiredArgsConstructor
public class CandidateController {
    private final CandidateService candidateService;

    //public 
    @PostMapping(value = "/public/apply", consumes = "multipart/form-data")
    public ApiResponse<CandidateResponse> applyPublic(
        @Valid @ModelAttribute CandidateApplicationRequest request,
        @RequestPart(value = "cv", required = false) MultipartFile cvFile,
        @RequestPart(value = "recommendationLetter", required = false) MultipartFile recommendationLetter,
        @RequestPart(value = "certificates", required = false) List<MultipartFile> certificates
    ) {
        return ApiResponse.success("Application submitted successfully",
            candidateService.applyPublic(request, cvFile, recommendationLetter, certificates));
    }

    //HR view candidates
    @GetMapping("/job-listing/{jobListingId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment:read')")
    public ApiResponse<List<CandidateResponse>> getCandidatesByJobListing(
        @PathVariable UUID jobListingId,
        Authentication authentication
    ) {
        return ApiResponse.success("Candidates retrieved",
            candidateService.getCandidatesByJobListing(jobListingId, authentication));
    }

    @GetMapping("/job-listing/{jobListingId}/stage/{stage}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment:read')")
    public ApiResponse<List<CandidateResponse>> getCandidatesByStage(
        @PathVariable UUID jobListingId,
        @PathVariable Integer stage,
        Authentication authentication
    ) {
        return ApiResponse.success("Candidates retrieved",
            candidateService.getCandidatesByStage(jobListingId, stage, authentication));
    }

    @GetMapping("/job-listing/{jobListingId}/status/{status}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment:read')")
    public ApiResponse<List<CandidateResponse>> getCandidatesByStatus(
        @PathVariable UUID jobListingId,
        @PathVariable String status,
        Authentication authentication
    ) {
        return ApiResponse.success("Candidates retrieved",
            candidateService.getCandidatesByStatus(jobListingId, status, authentication));
    }

    @GetMapping("/{candidateId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment:read')")
    public ApiResponse<CandidateResponse> getCandidateById(
        @PathVariable UUID candidateId,
        Authentication authentication
    ) {
        return ApiResponse.success("Candidate retrieved",
            candidateService.getCandidateById(candidateId, authentication));
    }

    //hr stage mangement
    @PostMapping("/{candidateId}/advance")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment:update')")
    public ApiResponse<CandidateResponse> advanceCandidate(
        @PathVariable UUID candidateId,
        Authentication authentication
    ) {
        return ApiResponse.success("Candidate advanced to next stage",
            candidateService.advanceCandidate(candidateId, authentication));
    }

    @PostMapping("/{candidateId}/accept")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment:update')")
    public ApiResponse<CandidateResponse> acceptCandidate(
        @PathVariable UUID candidateId,
        Authentication authentication
    ) {
        return ApiResponse.success("Candidate accepted",
            candidateService.acceptCandidate(candidateId, authentication));
    }

    @PostMapping("/{candidateId}/reject")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment:update')")
    public ApiResponse<CandidateResponse> rejectCandidate(
        @PathVariable UUID candidateId,
        Authentication authentication
    ) {
        return ApiResponse.success("Candidate rejected",
            candidateService.rejectCandidate(candidateId, authentication));
    }

    //add notes
    @PostMapping("/{candidateId}/notes")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment:update')")
    public ApiResponse<CandidateResponse> addNotes(
        @PathVariable UUID candidateId,
        @Valid @RequestBody CandidateNotesRequest request,
        Authentication authentication
    ) {
        return ApiResponse.success("Notes added",
            candidateService.addNotes(candidateId, request, authentication));
    }

    // ─── Hire candidate → create Employee ──────────────────────────────────
    @PostMapping("/{candidateId}/hire")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'recruitment:update')")
    public ApiResponse<CandidateResponse> hireCandidate(
        @PathVariable UUID candidateId,
        @Valid @RequestBody HireCandidateRequest request,
        Authentication authentication
    ) {
        return ApiResponse.success("Candidate hired and employee created",
            candidateService.hireCandidate(candidateId, request, authentication));
    }

    
}
