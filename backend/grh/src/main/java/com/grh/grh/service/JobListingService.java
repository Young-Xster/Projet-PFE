package com.grh.grh.service;

import com.grh.grh.dto.request.recruitment.CreateJobListingRequest;
import com.grh.grh.dto.request.recruitment.UpdateJobListingRequest;
import com.grh.grh.dto.response.recruitment.JobListingResponse;
import com.grh.grh.entity.*;
import com.grh.grh.event.ActivityLogEvent;
import com.grh.grh.event.NotificationEvent;
import com.grh.grh.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobListingService {
    private final JobListingRepository jobListingRepository;
    private final CompanyRepository companyRepository;
    private final PositionRepository positionRepository;
    private final DepartmentRepository departmentRepository;
    private final KeycloakUserService keycloakUserService;
    private final ApplicationEventPublisher eventPublisher;

    //public (for candidates portal)
    @Transactional(readOnly = true)
    public List<JobListingResponse> getPublicListings(UUID companyId, UUID departmentId) {
        List<JobListing> listings;

        if (companyId != null && departmentId != null) {
            listings = jobListingRepository.findByCompanyIdAndDepartmentIdAndStatus(
                companyId, departmentId, "open");
        } else if (companyId != null) {
            listings = jobListingRepository.findByCompanyIdAndStatusOrderByCreatedAtDesc(
                companyId, "open");
        } else if (departmentId != null) {
            listings = jobListingRepository.findByDepartmentIdAndStatus(departmentId, "open");
        } else {
            listings = jobListingRepository.findByStatus("open");
        }

        return listings.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public JobListingResponse getPublicListingById(UUID listingId) {
        JobListing listing = jobListingRepository.findById(listingId)
            .orElseThrow(() -> new IllegalArgumentException("Job listing not found"));
        if (!"open".equals(listing.getStatus())) {
            throw new IllegalStateException("This job listing is no longer accepting applications");
        }
        return mapToResponse(listing);
    }

     @Transactional
    public JobListingResponse createListing(
        CreateJobListingRequest request, Authentication authentication
    ) {
        UUID companyId = resolveCompanyId(authentication, request.getCompanyId());

        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new IllegalArgumentException("Company not found"));

        JobListing.JobListingBuilder builder = JobListing.builder()
            .company(company)
            .title(request.getTitle())
            .description(request.getDescription())
            .requirements(request.getRequirements())
            .employmentType(request.getEmploymentType() != null ? request.getEmploymentType() : "full-time")
            .salaryMin(request.getSalaryMin())
            .salaryMax(request.getSalaryMax())
            .numberOfPositions(request.getNumberOfPositions() != null ? request.getNumberOfPositions() : 1)
            .deadline(request.getDeadline())
            .status("open");
        if (request.getPositionId() != null) {
            Position position = positionRepository.findById(request.getPositionId())
                .orElseThrow(() -> new IllegalArgumentException("Position not found"));
            builder.position(position);
        }

        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Department not found"));
            builder.department(department);
        }

        JobListing listing = jobListingRepository.save(builder.build());

        UUID currentUserId = keycloakUserService.getCurrentUserId(authentication);

        // Publish notification event
        eventPublisher.publishEvent(NotificationEvent.builder()
            .companyId(company.getId())
            .type("SYSTEM")
            .title("Job Listing Created")
            .message(listing.getTitle() + " has been published")
            .targetModule("RECRUITMENT")
            .targetId(listing.getId())
            .importance("MEDIUM")
            .build());

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(company.getId())
            .userId(currentUserId)
            .action("JOB_LISTING_CREATED")
            .entityType("JOB_LISTING")
            .entityId(listing.getId())
            .build());

        log.info("Created job listing: {} for company: {}", listing.getTitle(), company.getName());
        return mapToResponse(listing);
    }

    @Transactional
    public JobListingResponse updateListing(
        UUID listingId, UpdateJobListingRequest request, Authentication authentication
    ) {
        JobListing listing = jobListingRepository.findById(listingId)
            .orElseThrow(() -> new IllegalArgumentException("Job listing not found"));

        validateCompanyAccess(listing.getCompany().getId(), authentication);

        if (request.getTitle() != null) listing.setTitle(request.getTitle());
        if (request.getDescription() != null) listing.setDescription(request.getDescription());
        if (request.getRequirements() != null) listing.setRequirements(request.getRequirements());
        if (request.getEmploymentType() != null) listing.setEmploymentType(request.getEmploymentType());
        if (request.getSalaryMin() != null) listing.setSalaryMin(request.getSalaryMin());
        if (request.getSalaryMax() != null) listing.setSalaryMax(request.getSalaryMax());
        if (request.getNumberOfPositions() != null) listing.setNumberOfPositions(request.getNumberOfPositions());
        if (request.getDeadline() != null) listing.setDeadline(request.getDeadline());

        if (request.getPositionId() != null) {
            Position position = positionRepository.findById(request.getPositionId())
                .orElseThrow(() -> new IllegalArgumentException("Position not found"));
            listing.setPosition(position);
        }
        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Department not found"));
            listing.setDepartment(department);
        }

        listing = jobListingRepository.save(listing);

        UUID currentUserId = keycloakUserService.getCurrentUserId(authentication);

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(listing.getCompany().getId())
            .userId(currentUserId)
            .action("JOB_LISTING_UPDATED")
            .entityType("JOB_LISTING")
            .entityId(listing.getId())
            .build());

        log.info("Updated job listing: {}", listingId);
        return mapToResponse(listing);
    }

    @Transactional
    public JobListingResponse closeListing(UUID listingId, Authentication authentication) {
        JobListing listing = jobListingRepository.findById(listingId)
            .orElseThrow(() -> new IllegalArgumentException("Job listing not found"));

        validateCompanyAccess(listing.getCompany().getId(), authentication);

        if ("closed".equals(listing.getStatus())) {
            throw new IllegalStateException("Job listing is already closed");
        }

        listing.setStatus("closed");
        listing = jobListingRepository.save(listing);

        UUID currentUserId = keycloakUserService.getCurrentUserId(authentication);

        // Publish notification event
        eventPublisher.publishEvent(NotificationEvent.builder()
            .companyId(listing.getCompany().getId())
            .type("SYSTEM")
            .title("Job Listing Closed")
            .message(listing.getTitle() + " has been closed")
            .targetModule("RECRUITMENT")
            .targetId(listing.getId())
            .importance("MEDIUM")
            .build());

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(listing.getCompany().getId())
            .userId(currentUserId)
            .action("JOB_LISTING_CLOSED")
            .entityType("JOB_LISTING")
            .entityId(listing.getId())
            .build());

        log.info("Closed job listing: {}", listingId);
        return mapToResponse(listing);
    }

    @Transactional(readOnly = true)
    public List<JobListingResponse> getMyCompanyListings(Authentication authentication) {
        UUID companyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (companyId == null && keycloakUserService.isSuperAdmin(authentication)) {
            // Super admin with no company sees all listings
            return jobListingRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        }
        if (companyId == null) {
            throw new IllegalStateException("User is not associated with any company");
        }
        return jobListingRepository.findByCompanyId(companyId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<JobListingResponse> getListingsByCompany(
        UUID companyId, Authentication authentication
    ) {
        validateCompanyAccess(companyId, authentication);
        return jobListingRepository.findByCompanyId(companyId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public JobListingResponse getListingById(UUID listingId, Authentication authentication) {
        JobListing listing = jobListingRepository.findById(listingId)
            .orElseThrow(() -> new IllegalArgumentException("Job listing not found"));
        validateCompanyAccess(listing.getCompany().getId(), authentication);
        return mapToResponse(listing);
    }

    @Transactional
    public void deleteListing(UUID listingId, Authentication authentication) {
        JobListing listing = jobListingRepository.findById(listingId)
            .orElseThrow(() -> new IllegalArgumentException("Job listing not found"));
        validateCompanyAccess(listing.getCompany().getId(), authentication);

        UUID currentUserId = keycloakUserService.getCurrentUserId(authentication);
        UUID companyId = listing.getCompany().getId();
        String listingTitle = listing.getTitle();

        jobListingRepository.delete(listing);

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(companyId)
            .userId(currentUserId)
            .action("JOB_LISTING_DELETED")
            .entityType("JOB_LISTING")
            .entityId(listingId)
            .build());

        log.info("Deleted job listing: {}", listingId);
    }

    //auto close listing when expired
    @Scheduled(cron = "0 0 0 * * *") // midnight every day
    @Transactional
    public void autoCloseExpiredListings() {
        int closed = jobListingRepository.closeExpiredListings(LocalDate.now());
        if (closed > 0) {
            log.info("Auto-closed {} expired job listings", closed);
            // Note: Scheduler doesn't publish activity logs - no user context
        }
    }

    //helper methods
    private UUID resolveCompanyId(Authentication authentication, UUID requestCompanyId) {
        UUID companyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (companyId != null) return companyId;
        if (keycloakUserService.isSuperAdmin(authentication) && requestCompanyId != null) {
            return requestCompanyId;
        }
        throw new IllegalStateException("User is not associated with any company");
    }

    private void validateCompanyAccess(UUID companyId, Authentication authentication) {
        if (keycloakUserService.isSuperAdmin(authentication)) return;
        UUID userCompanyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (userCompanyId == null || !userCompanyId.equals(companyId)) {
            throw new SecurityException("Access denied");
        }
    }

    private JobListingResponse mapToResponse(JobListing listing) {
        int totalCandidates = listing.getCandidates() != null ? listing.getCandidates().size() : 0;

        return JobListingResponse.builder()
            .id(listing.getId())
            .companyId(listing.getCompany().getId())
            .companyName(listing.getCompany().getName())
            .positionId(listing.getPosition() != null ? listing.getPosition().getId() : null)
            .positionTitle(listing.getPosition() != null ? listing.getPosition().getTitle() : null)
            .departmentId(listing.getDepartment() != null ? listing.getDepartment().getId() : null)
            .departmentName(listing.getDepartment() != null ? listing.getDepartment().getName() : null)
            .title(listing.getTitle())
            .description(listing.getDescription())
            .requirements(listing.getRequirements())
            .employmentType(listing.getEmploymentType())
            .salaryMin(listing.getSalaryMin())
            .salaryMax(listing.getSalaryMax())
            .numberOfPositions(listing.getNumberOfPositions())
            .deadline(listing.getDeadline())
            .status(listing.getStatus())
            .totalCandidates(totalCandidates)
            .createdAt(listing.getCreatedAt())
            .updatedAt(listing.getUpdatedAt())
            .build();
    }
}
