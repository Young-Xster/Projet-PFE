package com.grh.grh.service;


import com.grh.grh.dto.request.recruitment.CandidateApplicationRequest;
import com.grh.grh.dto.request.recruitment.CandidateNotesRequest;
import com.grh.grh.dto.response.recruitment.CandidateResponse;
import com.grh.grh.entity.Candidate;
import com.grh.grh.entity.JobListing;
import com.grh.grh.repository.CandidateRepository;
import com.grh.grh.repository.JobListingRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateService {
    private final CandidateRepository candidateRepository;
    private final JobListingRepository jobListingRepository;
    private final FileStorageService fileStorageService;
    private final EmailService emailService;
    private final KeycloakUserService keycloakUserService;

    // public 

    @Transactional
    public CandidateResponse applyPublic(
        CandidateApplicationRequest request , 
        MultipartFile cvFile ,
        MultipartFile recommendationLetter,
        List<MultipartFile> certificates
    ){
        JobListing listing = jobListingRepository.findById(request.getJobListingId())
            .orElseThrow(() -> new IllegalArgumentException("Job listing not found"));

        if (!"open".equals(listing.getStatus())) {
            throw new IllegalStateException("This job listing is no longer accepting applications");
        }

        if (listing.getDeadline() != null && listing.getDeadline().isBefore(java.time.LocalDate.now())) {
            throw new IllegalStateException("The application deadline has passed");
        }

        if (candidateRepository.existsByEmailAndJobListingId(request.getEmail(), request.getJobListingId())) {
            throw new IllegalStateException("You have already applied for this position");
        }

        // Store files
        String cvPath = null;
        if (cvFile != null && !cvFile.isEmpty()) {
            cvPath = fileStorageService.storeFile(cvFile, "cv");
        }

        String recLetterPath = null;
        if (recommendationLetter != null && !recommendationLetter.isEmpty()) {
            recLetterPath = fileStorageService.storeFile(recommendationLetter, "recommendations");
        }

        String certPaths = null;
        if (certificates != null && !certificates.isEmpty()) {
            certPaths = certificates.stream()
                .filter(f -> f != null && !f.isEmpty())
                .map(f -> fileStorageService.storeFile(f, "certificates"))
                .collect(Collectors.joining(","));
        }

        Candidate candidate = Candidate.builder()
            .jobListing(listing)
            .company(listing.getCompany())
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .email(request.getEmail())
            .phone(request.getPhone())
            .dateOfBirth(request.getDateOfBirth())
            .address(request.getAddress())
            .city(request.getCity())
            .educationLevel(request.getEducationLevel())
            .experienceYears(request.getExperienceYears())
            .previousEmployer(request.getPreviousEmployer())
            .skills(request.getSkills())
            .languagesSpoken(request.getLanguagesSpoken())
            .availabilityDate(request.getAvailabilityDate())
            .cvFilePath(cvPath)
            .recommendationLetterPath(recLetterPath)
            .certificatesPaths(certPaths)
            .currentStage(1)
            .status("stage_1")
            .appliedAt(OffsetDateTime.now())
            .build();

        candidate = candidateRepository.save(candidate);
     emailService.sendApplicationReceivedEmail(
            request.getEmail(),
            request.getFirstName() + " " + request.getLastName(),
            listing.getTitle(),
            listing.getCompany().getName()
        );

        log.info("New application from {} {} for job: {}",
            request.getFirstName(), request.getLastName(), listing.getTitle());

        return mapToResponse(candidate);
    }

    //HR view candidates
    @Transactional(readOnly = true)
    public List<CandidateResponse> getCandidatesByJobListing(
        UUID jobListingId, Authentication authentication
    ) {
        JobListing listing = getListingWithAccess(jobListingId, authentication);
        return candidateRepository.findByJobListingId(jobListingId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CandidateResponse> getCandidatesByStage(
        UUID jobListingId, Integer stage, Authentication authentication
    ) {
        JobListing listing = getListingWithAccess(jobListingId, authentication);
        return candidateRepository.findByJobListingIdAndCurrentStage(jobListingId, stage).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CandidateResponse> getCandidatesByStatus(
        UUID jobListingId, String status, Authentication authentication
    ) {
        JobListing listing = getListingWithAccess(jobListingId, authentication);
        return candidateRepository.findByJobListingIdAndStatus(jobListingId, status).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CandidateResponse getCandidateById(UUID candidateId, Authentication authentication) {
        Candidate candidate = candidateRepository.findById(candidateId)
            .orElseThrow(() -> new IllegalArgumentException("Candidate not found"));
        validateCompanyAccess(candidate.getCompany().getId(), authentication);
        return mapToResponse(candidate);
    }

    // advance to next stage

    @Transactional
    public CandidateResponse advanceCandidate(UUID candidateId, Authentication authentication) {
        Candidate candidate = candidateRepository.findById(candidateId)
            .orElseThrow(() -> new IllegalArgumentException("Candidate not found"));

        validateCompanyAccess(candidate.getCompany().getId(), authentication);

        if ("rejected".equals(candidate.getStatus())) {
            throw new IllegalStateException("Cannot advance a rejected candidate");
        }
        if ("accepted".equals(candidate.getStatus())) {
            throw new IllegalStateException("Candidate is already accepted");
        }
        if (candidate.getCurrentStage() >= 2) {
            throw new IllegalStateException("Candidate is already at the final stage. Use accept or reject.");
        }
        candidate.setCurrentStage(2);
        candidate.setStatus("stage_2");
        candidate = candidateRepository.save(candidate);

        log.info("Advanced candidate {} {} to stage 2",
            candidate.getFirstName(), candidate.getLastName());
        return mapToResponse(candidate);
    }

    // accept candidate

    @Transactional
    public CandidateResponse acceptCandidate(UUID candidateId, Authentication authentication) {
        Candidate candidate = candidateRepository.findById(candidateId)
            .orElseThrow(() -> new IllegalArgumentException("Candidate not found"));

        validateCompanyAccess(candidate.getCompany().getId(), authentication);

        if ("rejected".equals(candidate.getStatus())) {
            throw new IllegalStateException("Cannot accept a rejected candidate");
        }
        if ("accepted".equals(candidate.getStatus())) {
            throw new IllegalStateException("Candidate is already accepted");
        }

        candidate.setStatus("accepted");
        candidate = candidateRepository.save(candidate);
        emailService.sendCandidateAcceptedEmail(
            candidate.getEmail(),
            candidate.getFirstName() + " " + candidate.getLastName(),
            candidate.getJobListing().getTitle(),
            candidate.getCompany().getName()
        );

        log.info("Accepted candidate {} {} for job: {}",
            candidate.getFirstName(), candidate.getLastName(),
            candidate.getJobListing().getTitle());

        return mapToResponse(candidate);
    }

    // reject candidate

    @Transactional
    public CandidateResponse rejectCandidate(UUID candidateId, Authentication authentication) {
        Candidate candidate = candidateRepository.findById(candidateId)
            .orElseThrow(() -> new IllegalArgumentException("Candidate not found"));

        validateCompanyAccess(candidate.getCompany().getId(), authentication);

        if ("rejected".equals(candidate.getStatus())) {
            throw new IllegalStateException("Candidate is already rejected");
        }
        if ("accepted".equals(candidate.getStatus())) {
            throw new IllegalStateException("Cannot reject an accepted candidate");
        }

        candidate.setRejectedAtStage(candidate.getCurrentStage());
        candidate.setStatus("rejected");
        candidate = candidateRepository.save(candidate);
        emailService.sendCandidateRejectedEmail(
            candidate.getEmail(),
            candidate.getFirstName() + " " + candidate.getLastName(),
            candidate.getJobListing().getTitle(),
            candidate.getCompany().getName()
        );

        log.info("Rejected candidate {} {} at stage {} for job: {}",
            candidate.getFirstName(), candidate.getLastName(),
            candidate.getRejectedAtStage(), candidate.getJobListing().getTitle());

        return mapToResponse(candidate);
    }

    //add notes after intervew 
    @Transactional
    public CandidateResponse addNotes(
        UUID candidateId, CandidateNotesRequest request, Authentication authentication
    ) {
        Candidate candidate = candidateRepository.findById(candidateId)
            .orElseThrow(() -> new IllegalArgumentException("Candidate not found"));

        validateCompanyAccess(candidate.getCompany().getId(), authentication);

        // Append notes with timestamp
        String existingNotes = candidate.getHrNotes() != null ? candidate.getHrNotes() : "";
        String timestamp = java.time.LocalDateTime.now()
            .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        String updatedNotes = existingNotes
            + (existingNotes.isEmpty() ? "" : "\n\n")
            + "[" + timestamp + "] " + request.getNotes();

        candidate.setHrNotes(updatedNotes);
        candidate = candidateRepository.save(candidate);

        return mapToResponse(candidate);
    }



    //helper methods
    private JobListing getListingWithAccess(UUID jobListingId, Authentication authentication) {
        JobListing listing = jobListingRepository.findById(jobListingId)
            .orElseThrow(() -> new IllegalArgumentException("Job listing not found"));
        validateCompanyAccess(listing.getCompany().getId(), authentication);
        return listing;
    }

    private void validateCompanyAccess(UUID companyId, Authentication authentication) {
        if (keycloakUserService.isSuperAdmin(authentication)) return;
        UUID userCompanyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (userCompanyId == null || !userCompanyId.equals(companyId)) {
            throw new SecurityException("Access denied");
        }
    }

    private CandidateResponse mapToResponse(Candidate candidate) {
        List<String> certUrls = null;
        if (candidate.getCertificatesPaths() != null && !candidate.getCertificatesPaths().isBlank()) {
            certUrls = Arrays.asList(candidate.getCertificatesPaths().split(","));
        }

        return CandidateResponse.builder()
            .id(candidate.getId())
            .jobListingId(candidate.getJobListing() != null ? candidate.getJobListing().getId() : null)
            .jobTitle(candidate.getJobListing() != null ? candidate.getJobListing().getTitle() : null)
            .companyName(candidate.getCompany() != null ? candidate.getCompany().getName() : null)
            .departmentName(candidate.getJobListing() != null && candidate.getJobListing().getDepartment() != null
                ? candidate.getJobListing().getDepartment().getName() : null)
            .firstName(candidate.getFirstName())
            .lastName(candidate.getLastName())
            .email(candidate.getEmail())
            .phone(candidate.getPhone())
            .dateOfBirth(candidate.getDateOfBirth())
            .address(candidate.getAddress())
            .city(candidate.getCity())
            .educationLevel(candidate.getEducationLevel())
            .experienceYears(candidate.getExperienceYears())
            .previousEmployer(candidate.getPreviousEmployer())
            .skills(candidate.getSkills())
            .languagesSpoken(candidate.getLanguagesSpoken())
            .availabilityDate(candidate.getAvailabilityDate())
            .cvFileUrl(candidate.getCvFilePath())
            .recommendationLetterUrl(candidate.getRecommendationLetterPath())
            .certificateUrls(certUrls)
            .currentStage(candidate.getCurrentStage())
            .status(candidate.getStatus())
            .rejectedAtStage(candidate.getRejectedAtStage())
            .hrNotes(candidate.getHrNotes())
            .aiMatchScore(candidate.getAiMatchScore())
            .appliedAt(candidate.getAppliedAt())
            .createdAt(candidate.getCreatedAt())
            .updatedAt(candidate.getUpdatedAt())
            .build();
    }




}
