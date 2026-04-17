package com.grh.grh.service;


import com.grh.grh.dto.request.recruitment.CandidateApplicationRequest;
import com.grh.grh.dto.request.recruitment.CandidateNotesRequest;
import com.grh.grh.dto.request.recruitment.HireCandidateRequest;
import com.grh.grh.dto.response.recruitment.CandidateResponse;
import com.grh.grh.entity.*;
import com.grh.grh.event.ActivityLogEvent;
import com.grh.grh.event.NotificationEvent;
import com.grh.grh.repository.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateService {
    private final CandidateRepository candidateRepository;
    private final JobListingRepository jobListingRepository;
    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final DepartmentRepository departmentRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final FileStorageService fileStorageService;
    private final EmailService emailService;
    private final ActivityLogService activityLogService;
    private final KeycloakUserService keycloakUserService;
    private final PublicApplicationAttemptRepository publicApplicationAttemptRepository;
    private final TurnstileService turnstileService;
    private final ApplicationEventPublisher eventPublisher;

    // public 

    @Transactional
    public CandidateResponse applyPublic(
        CandidateApplicationRequest request , 
        MultipartFile cvFile ,
        MultipartFile recommendationLetter,
        List<MultipartFile> certificates,
        String ipAddress,
        String userAgent
    ){
        turnstileService.verifyToken(request.getTurnstileToken(), ipAddress);

        String normalizedEmail = normalizeEmail(request.getEmail());

        JobListing listing = jobListingRepository.findById(request.getJobListingId())
            .orElseThrow(() -> new IllegalArgumentException("Job listing not found"));

        if (!"open".equals(listing.getStatus())) {
            logPublicAttempt(listing, normalizedEmail, ipAddress, userAgent, "REJECTED", "JOB_CLOSED");
            throw new IllegalStateException("This job listing is no longer accepting applications");
        }

        if (listing.getDeadline() != null && listing.getDeadline().isBefore(java.time.LocalDate.now())) {
            logPublicAttempt(listing, normalizedEmail, ipAddress, userAgent, "REJECTED", "DEADLINE_PASSED");
            throw new IllegalStateException("The application deadline has passed");
        }

        if (candidateRepository.existsByNormalizedEmailAndJobListingId(normalizedEmail, request.getJobListingId())) {
            logPublicAttempt(listing, normalizedEmail, ipAddress, userAgent, "REJECTED", "DUPLICATE_APPLICATION");
            throw new IllegalStateException("You have already applied for this position");
        }

        List<String> storedPaths = new ArrayList<>();

        // Store files
        String cvPath = null;
        if (cvFile != null && !cvFile.isEmpty()) {
            cvPath = fileStorageService.storeFile(cvFile, "cv");
            storedPaths.add(cvPath);
        }

        String recLetterPath = null;
        if (recommendationLetter != null && !recommendationLetter.isEmpty()) {
            recLetterPath = fileStorageService.storeFile(recommendationLetter, "recommendations");
            storedPaths.add(recLetterPath);
        }

        String certPaths = null;
        if (certificates != null && !certificates.isEmpty()) {
            List<String> certificatePathList = certificates.stream()
                .filter(f -> f != null && !f.isEmpty())
                .map(f -> fileStorageService.storeFile(f, "certificates"))
                .toList();
            storedPaths.addAll(certificatePathList);
            certPaths = String.join(",", certificatePathList);
        }

        try {
            Candidate candidate = Candidate.builder()
                .jobListing(listing)
                .company(listing.getCompany())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
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
                candidate.getEmail(),
                request.getFirstName() + " " + request.getLastName(),
                listing.getTitle(),
                listing.getCompany().getName()
            );

            logPublicAttempt(listing, normalizedEmail, ipAddress, userAgent, "ACCEPTED", null);

            // Publish notification event
            eventPublisher.publishEvent(NotificationEvent.builder()
                .companyId(listing.getCompany().getId())
                .type("CANDIDATE_APPLIED")
                .title("New Job Application Received")
                .message(request.getFirstName() + " " + request.getLastName() + " applied for " + listing.getTitle())
                .targetModule("RECRUITMENT")
                .targetId(candidate.getId())
                .importance("MEDIUM")
                .build());

            // Publish activity log event
            eventPublisher.publishEvent(ActivityLogEvent.builder()
                .companyId(listing.getCompany().getId())
                .userId(null)
                .action("CANDIDATE_APPLIED")
                .entityType("CANDIDATE")
                .entityId(candidate.getId())
                .build());

            log.info("New application from {} {} for job: {}",
                request.getFirstName(), request.getLastName(), listing.getTitle());

            return mapToResponse(candidate);
        } catch (DataIntegrityViolationException ex) {
            cleanupStoredFiles(storedPaths);
            logPublicAttempt(listing, normalizedEmail, ipAddress, userAgent, "REJECTED", "DUPLICATE_RACE_CONDITION");
            throw new IllegalStateException("You have already applied for this position");
        } catch (RuntimeException ex) {
            cleanupStoredFiles(storedPaths);
            logPublicAttempt(listing, normalizedEmail, ipAddress, userAgent, "REJECTED", "APPLICATION_ERROR");
            throw ex;
        }
    }

    private void logPublicAttempt(
        JobListing listing,
        String normalizedEmail,
        String ipAddress,
        String userAgent,
        String outcome,
        String reason
    ) {
        PublicApplicationAttempt attempt = PublicApplicationAttempt.builder()
            .jobListing(listing)
            .normalizedEmail(normalizedEmail)
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .outcome(outcome)
            .reason(reason)
            .createdAt(OffsetDateTime.now())
            .build();
        publicApplicationAttemptRepository.save(attempt);
    }

    private void cleanupStoredFiles(List<String> storedPaths) {
        if (storedPaths == null || storedPaths.isEmpty()) {
            return;
        }

        storedPaths.stream()
            .filter(path -> path != null && !path.isBlank())
            .forEach(fileStorageService::deleteFile);
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return "";
        }
        return email.trim().toLowerCase(Locale.ROOT);
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

        UUID currentUserId = keycloakUserService.getCurrentUserId(authentication);

        // Publish notification event
        eventPublisher.publishEvent(NotificationEvent.builder()
            .companyId(candidate.getCompany().getId())
            .type("CANDIDATE_ADVANCED")
            .title("Candidate Advanced to Stage 2")
            .message(candidate.getFirstName() + " " + candidate.getLastName() + " has advanced to stage 2 for " +
                candidate.getJobListing().getTitle())
            .targetModule("RECRUITMENT")
            .targetId(candidate.getId())
            .importance("LOW")
            .build());

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(candidate.getCompany().getId())
            .userId(currentUserId)
            .action("CANDIDATE_ADVANCED")
            .entityType("CANDIDATE")
            .entityId(candidate.getId())
            .build());

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

        UUID currentUserId = keycloakUserService.getCurrentUserId(authentication);

        // Publish notification event
        eventPublisher.publishEvent(NotificationEvent.builder()
            .companyId(candidate.getCompany().getId())
            .type("CANDIDATE_ACCEPTED")
            .title("Candidate Accepted")
            .message(candidate.getFirstName() + " " + candidate.getLastName() + " has been accepted for " +
                candidate.getJobListing().getTitle())
            .targetModule("RECRUITMENT")
            .targetId(candidate.getId())
            .importance("HIGH")
            .build());

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(candidate.getCompany().getId())
            .userId(currentUserId)
            .action("CANDIDATE_ACCEPTED")
            .entityType("CANDIDATE")
            .entityId(candidate.getId())
            .build());

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

        UUID currentUserId = keycloakUserService.getCurrentUserId(authentication);

        // Publish notification event
        eventPublisher.publishEvent(NotificationEvent.builder()
            .companyId(candidate.getCompany().getId())
            .type("CANDIDATE_REJECTED")
            .title("Candidate Rejected")
            .message(candidate.getFirstName() + " " + candidate.getLastName() + " was rejected at stage " +
                candidate.getRejectedAtStage() + " for " + candidate.getJobListing().getTitle())
            .targetModule("RECRUITMENT")
            .targetId(candidate.getId())
            .importance("MEDIUM")
            .build());

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(candidate.getCompany().getId())
            .userId(currentUserId)
            .action("CANDIDATE_REJECTED")
            .entityType("CANDIDATE")
            .entityId(candidate.getId())
            .build());

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

    // ─── Hire candidate → create Employee ──────────────────────────────────

    @Transactional
    public CandidateResponse hireCandidate(UUID candidateId, HireCandidateRequest request, Authentication authentication) {
        Candidate candidate = candidateRepository.findById(candidateId)
            .orElseThrow(() -> new IllegalArgumentException("Candidate not found"));

        validateCompanyAccess(candidate.getCompany().getId(), authentication);

        String status = candidate.getStatus();
        if (!"accepted".equals(status) && !"stage_2".equals(status) && !"stage2".equals(status)) {
            throw new IllegalStateException("Only accepted or stage_2 candidates can be hired. Current status: " + status);
        }

        if (candidate.getHiredEmployeeId() != null) {
            throw new IllegalStateException("Candidate has already been hired");
        }

        // Check email uniqueness
        if (employeeRepository.existsByEmail(candidate.getEmail())) {
            throw new IllegalArgumentException("An employee with email " + candidate.getEmail() + " already exists");
        }

        Company company = candidate.getCompany();

        Employee.EmployeeBuilder employeeBuilder = Employee.builder()
            .company(company)
            .firstName(candidate.getFirstName())
            .lastName(candidate.getLastName())
            .email(candidate.getEmail())
            .phoneNumber(candidate.getPhone() != null ? candidate.getPhone() : "N/A")
            .dateOfBirth(candidate.getDateOfBirth())
            .address(candidate.getAddress() != null ? candidate.getAddress() : "N/A")
            .city(candidate.getCity() != null ? candidate.getCity() : "N/A")
            .hireDate(request.getHireDate())
            .jobTitle(request.getJobTitle())
            .employmentType(request.getEmploymentType())
            .salary(request.getSalary())
            .status("active")
            // Fields from request (not on candidate)
            .gender(request.getGender() != null ? request.getGender() : "male")
            .postalCode(request.getPostalCode() != null ? request.getPostalCode() : "N/A")
            .country(request.getCountry() != null ? request.getCountry() : "N/A")
            .nationalId(request.getNationalId() != null ? request.getNationalId() : "PENDING-" + UUID.randomUUID().toString().substring(0, 8));

        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Department not found"));
            employeeBuilder.department(department);
        } else if (candidate.getJobListing() != null && candidate.getJobListing().getDepartment() != null) {
            employeeBuilder.department(candidate.getJobListing().getDepartment());
        }

        if (request.getManagerId() != null) {
            Employee manager = employeeRepository.findById(request.getManagerId())
                .orElseThrow(() -> new IllegalArgumentException("Manager not found"));
            employeeBuilder.manager(manager);
        }

        Employee employee = employeeRepository.save(employeeBuilder.build());

        // Link candidate to employee
        candidate.setStatus("hired");
        candidate.setHiredEmployeeId(employee.getEmployeeId());
        candidate = candidateRepository.save(candidate);

        UUID currentUserId = null;
        try {
            currentUserId = keycloakUserService.getCurrentUserId(authentication);
        } catch (Exception ex) {
            // Ignore if current user ID can't be resolved
        }

        String employeeName = employee.getFirstName() + " " + employee.getLastName();

        // Publish notification event
        eventPublisher.publishEvent(NotificationEvent.builder()
            .companyId(company.getId())
            .type("CANDIDATE_HIRED")
            .title("New Employee Hired from Recruitment")
            .message(employeeName + " has been hired and created as a new employee")
            .targetModule("RECRUITMENT")
            .targetId(candidate.getId())
            .importance("HIGH")
            .build());

        // Publish activity log events
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(company.getId())
            .userId(currentUserId)
            .action("EMPLOYEE_CREATED")
            .entityType("EMPLOYEE")
            .entityId(employee.getEmployeeId())
            .build());

        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(company.getId())
            .userId(currentUserId)
            .action("CANDIDATE_HIRED")
            .entityType("CANDIDATE")
            .entityId(candidate.getId())
            .build());

        // Initialize leave balances for the new employee
        initializeLeaveBalances(employee, company);

        log.info("Hired candidate {} {} → Employee ID: {}",
            candidate.getFirstName(), candidate.getLastName(), employee.getEmployeeId());

        return mapToResponse(candidate);
    }

    /**
     * Initializes leave balances for a newly created employee based on
     * the company's leave types and their maxDaysPerYear.
     */
    private void initializeLeaveBalances(Employee employee, Company company) {
        int currentYear = java.time.LocalDate.now().getYear();
        List<LeaveType> leaveTypes = leaveTypeRepository.findByCompanyId(company.getId());
        for (LeaveType lt : leaveTypes) {
            if (lt.getMaxDaysPerYear() != null && lt.getMaxDaysPerYear() > 0) {
                LeaveBalance balance = LeaveBalance.builder()
                    .company(company)
                    .employee(employee)
                    .leaveType(lt)
                    .year(currentYear)
                    .totalDays(lt.getMaxDaysPerYear())
                    .usedDays(0)
                    .remainingDays(lt.getMaxDaysPerYear())
                    .build();
                leaveBalanceRepository.save(balance);
            }
        }
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
            .hiredEmployeeId(candidate.getHiredEmployeeId())
            .aiMatchScore(candidate.getAiMatchScore())
            .aiMatchRationale(candidate.getAiMatchRationale())
            .appliedAt(candidate.getAppliedAt())
            .createdAt(candidate.getCreatedAt())
            .updatedAt(candidate.getUpdatedAt())
            .build();
    }




}
