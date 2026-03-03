package com.grh.grh.service;

import com.grh.grh.dto.request.recruitment.CreateInterviewStageRequest;
import com.grh.grh.dto.response.recruitment.InterviewStageResponse;
import com.grh.grh.entity.*;
import com.grh.grh.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InterviewStageService {

    private final InterviewStageRepository interviewStageRepository;
    private final CandidateRepository candidateRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final KeycloakUserService keycloakUserService;

    // ═══════════════════════════════════════════════════════════════════════
    // CREATE
    // ═══════════════════════════════════════════════════════════════════════

    @Transactional
    public InterviewStageResponse create(CreateInterviewStageRequest request, Authentication auth) {
        validateCompanyAccess(request.getCompanyId(), auth);

        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new IllegalArgumentException("Company not found"));
        Candidate candidate = candidateRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found"));

        if (!candidate.getCompany().getId().equals(request.getCompanyId())) {
            throw new IllegalArgumentException("Candidate does not belong to this company");
        }

        InterviewStage stage = InterviewStage.builder()
                .company(company)
                .candidate(candidate)
                .stageName(request.getStageName())
                .stageNumber(request.getStageNumber())
                .scheduledAt(request.getScheduledAt())
                .interviewerIds(request.getInterviewerId() != null
                        ? new UUID[]{request.getInterviewerId()} : new UUID[0])
                .status(request.getStatus() != null ? request.getStatus() : "scheduled")
                .build();

        stage = interviewStageRepository.save(stage);
        log.info("Created interview stage '{}' for candidate {}", stage.getStageName(), candidate.getId());
        return mapToResponse(stage);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE
    // ═══════════════════════════════════════════════════════════════════════

    @Transactional
    public InterviewStageResponse updateStatus(UUID stageId, String status, String feedback,
                                                Integer rating, Authentication auth) {
        InterviewStage stage = interviewStageRepository.findById(stageId)
                .orElseThrow(() -> new IllegalArgumentException("Interview stage not found"));
        validateCompanyAccess(stage.getCompany().getId(), auth);

        if (status != null) {
            if (!List.of("scheduled", "completed", "cancelled").contains(status.toLowerCase())) {
                throw new IllegalArgumentException("Invalid status: " + status);
            }
            stage.setStatus(status.toLowerCase());
        }
        if (feedback != null) stage.setFeedback(feedback);
        if (rating != null) {
            if (rating < 1 || rating > 5)
                throw new IllegalArgumentException("Rating must be between 1 and 5");
            stage.setRating(rating);
        }

        stage = interviewStageRepository.save(stage);
        log.info("Updated interview stage: {} → status={}", stageId, stage.getStatus());
        return mapToResponse(stage);
    }

    @Transactional
    public InterviewStageResponse reschedule(UUID stageId, OffsetDateTime newDate, Authentication auth) {
        InterviewStage stage = interviewStageRepository.findById(stageId)
                .orElseThrow(() -> new IllegalArgumentException("Interview stage not found"));
        validateCompanyAccess(stage.getCompany().getId(), auth);

        if ("completed".equalsIgnoreCase(stage.getStatus())) {
            throw new IllegalStateException("Cannot reschedule a completed interview");
        }

        stage.setScheduledAt(newDate);
        stage.setStatus("scheduled");
        stage = interviewStageRepository.save(stage);

        log.info("Rescheduled interview stage {} to {}", stageId, newDate);
        return mapToResponse(stage);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // READ
    // ═══════════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public InterviewStageResponse getById(UUID stageId, Authentication auth) {
        InterviewStage stage = interviewStageRepository.findById(stageId)
                .orElseThrow(() -> new IllegalArgumentException("Interview stage not found"));
        validateCompanyAccess(stage.getCompany().getId(), auth);
        return mapToResponse(stage);
    }

    @Transactional(readOnly = true)
    public List<InterviewStageResponse> getByCandidate(UUID candidateId, Authentication auth) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found"));
        validateCompanyAccess(candidate.getCompany().getId(), auth);
        return interviewStageRepository.findByCandidateIdOrderByStageNumber(candidateId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InterviewStageResponse> getByCompany(UUID companyId, Authentication auth) {
        validateCompanyAccess(companyId, auth);
        return interviewStageRepository.findByCompanyId(companyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InterviewStageResponse> getUpcoming(OffsetDateTime from, OffsetDateTime to, Authentication auth) {
        return interviewStageRepository.findByScheduledAtBetween(from, to).stream()
                .filter(s -> {
                    try {
                        validateCompanyAccess(s.getCompany().getId(), auth);
                        return true;
                    } catch (SecurityException e) {
                        return false;
                    }
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void delete(UUID stageId, Authentication auth) {
        InterviewStage stage = interviewStageRepository.findById(stageId)
                .orElseThrow(() -> new IllegalArgumentException("Interview stage not found"));
        validateCompanyAccess(stage.getCompany().getId(), auth);

        if ("completed".equalsIgnoreCase(stage.getStatus())) {
            throw new IllegalStateException("Cannot delete a completed interview stage");
        }

        interviewStageRepository.delete(stage);
        log.info("Deleted interview stage: {}", stageId);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    private void validateCompanyAccess(UUID companyId, Authentication auth) {
        if (keycloakUserService.isSuperAdmin(auth)) return;
        UUID userCid = keycloakUserService.getCurrentUserCompanyId(auth);
        if (userCid == null || !userCid.equals(companyId))
            throw new SecurityException("Access denied");
    }

    private InterviewStageResponse mapToResponse(InterviewStage s) {
        String candidateName = null;
        if (s.getCandidate() != null) {
            candidateName = (s.getCandidate().getFirstName() != null ? s.getCandidate().getFirstName() : "")
                    + " "
                    + (s.getCandidate().getLastName() != null ? s.getCandidate().getLastName() : "");
            candidateName = candidateName.trim();
        }

        // Resolve first interviewer name
        UUID interviewerId = null;
        String interviewerName = null;
        if (s.getInterviewerIds() != null && s.getInterviewerIds().length > 0) {
            interviewerId = s.getInterviewerIds()[0];
            interviewerName = userRepository.findById(interviewerId)
                    .map(User::getUsername)
                    .orElse(null);
        }

        return InterviewStageResponse.builder()
                .id(s.getId())
                .candidateId(s.getCandidate() != null ? s.getCandidate().getId() : null)
                .candidateName(candidateName)
                .stageName(s.getStageName())
                .stageNumber(s.getStageNumber())
                .scheduledAt(s.getScheduledAt())
                .interviewerId(interviewerId)
                .interviewerName(interviewerName)
                .status(s.getStatus())
                .feedback(s.getFeedback())
                .result(s.getRating() != null ? s.getRating() + "/5" : null)
                .createdAt(s.getCreatedAt())
                .build();
    }
}