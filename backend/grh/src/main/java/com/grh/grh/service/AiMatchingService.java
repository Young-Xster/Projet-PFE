package com.grh.grh.service;

import com.grh.grh.dto.request.ai.AiCandidatePayload;
import com.grh.grh.dto.request.ai.AiMatchRequest;
import com.grh.grh.dto.response.ai.AiMatchResponse;
import com.grh.grh.dto.response.ai.AiMatchResult;
import com.grh.grh.entity.Candidate;
import com.grh.grh.entity.JobListing;
import com.grh.grh.repository.CandidateRepository;
import com.grh.grh.repository.JobListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiMatchingService {

    private final CandidateRepository candidateRepository;
    private final JobListingRepository jobListingRepository;
    private final FileStorageService fileStorageService;
    private final RestTemplate restTemplate;
    private final ActivityLogService activityLogService;

    @Value("${ai.service.url:http://localhost:8082/api/v1}")
    private String aiServiceUrl;

    @Transactional
    public List<AiMatchResult> matchCandidates(UUID jobListingId) {
        JobListing listing = jobListingRepository.findById(jobListingId)
                .orElseThrow(() -> new IllegalArgumentException("Job listing not found"));

        List<Candidate> candidates = candidateRepository.findByJobListingId(jobListingId);
        if (candidates.isEmpty())
            throw new IllegalStateException("No candidates found for this listing");

        List<AiCandidatePayload> candidatePayloads = candidates.stream().map(c -> {
            AiCandidatePayload.AiCandidatePayloadBuilder builder = AiCandidatePayload.builder()
                    .candidateId(c.getId())
                    .firstName(c.getFirstName())
                    .lastName(c.getLastName())
                    .skills(c.getSkills())
                    .experienceYears(c.getExperienceYears())
                    .educationLevel(c.getEducationLevel());

            if (c.getCvFilePath() != null) {
                try {
                    byte[] cvBytes = fileStorageService.loadFile(c.getCvFilePath());
                    builder.cvBase64(Base64.getEncoder().encodeToString(cvBytes));
                    builder.cvFileName(Paths.get(c.getCvFilePath()).getFileName().toString());
                } catch (Exception e) {
                    log.warn("Could not load CV for candidate {}: {}", c.getId(), e.getMessage());
                }
            }
            
            if (c.getRecommendationLetterPath() != null) {
                try {
                    byte[] recBytes = fileStorageService.loadFile(c.getRecommendationLetterPath());
                    builder.recommendationBase64(Base64.getEncoder().encodeToString(recBytes));
                } catch (Exception e) {
                    log.warn("Could not load recommendation letter for candidate {}: {}", c.getId(), e.getMessage());
                }
            }
            
            if (c.getCertificatesPaths() != null && !c.getCertificatesPaths().isBlank()) {
                java.util.List<String> certsBase64 = new java.util.ArrayList<>();
                for (String certPath : c.getCertificatesPaths().split(",")) {
                    if (!certPath.trim().isEmpty()) {
                        try {
                            byte[] certBytes = fileStorageService.loadFile(certPath.trim());
                            certsBase64.add(Base64.getEncoder().encodeToString(certBytes));
                        } catch (Exception e) {
                            log.warn("Could not load certificate {} for candidate {}: {}", certPath, c.getId(), e.getMessage());
                        }
                    }
                }
                builder.certificatesBase64(certsBase64);
            }
            
            return builder.build();
        }).collect(Collectors.toList());

        AiMatchRequest aiRequest = AiMatchRequest.builder()
                .jobListingId(jobListingId)
                .jobTitle(listing.getTitle())
                .jobDescription(listing.getDescription())
                .requirements(listing.getRequirements())
                .candidates(candidatePayloads)
                .build();

        AiMatchResponse aiResponse = restTemplate.postForObject(
                aiServiceUrl + "/match", aiRequest, AiMatchResponse.class);

        if (aiResponse != null && aiResponse.getResults() != null) {
            aiResponse.getResults().forEach(result ->
                    candidateRepository.findById(result.getCandidateId()).ifPresent(c -> {
                        c.setAiMatchScore(result.getScore());
                        c.setAiMatchRationale(result.getReasoning());
                        candidateRepository.save(c);
                    })
            );

            activityLogService.logActivity(
                    listing.getCompany().getId(),
                    null,
                    "CANDIDATES_AI_MATCHED",
                    "JOB_LISTING",
                    listing.getId()
            );

            return aiResponse.getResults();
        }

        return List.of();
    }
}
