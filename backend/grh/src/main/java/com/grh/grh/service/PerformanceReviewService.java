package com.grh.grh.service;

import com.grh.grh.dto.request.performance.CreatePerformanceReviewRequest;
import com.grh.grh.dto.request.performance.UpdatePerformanceReviewRequest;
import com.grh.grh.dto.response.performance.PerformanceReviewResponse;
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
public class PerformanceReviewService {

    private final PerformanceReviewRepository performanceReviewRepository;
    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final KeycloakUserService keycloakUserService;

    // ─── HR creates a review for an employee ─────────────────────────────────

    @Transactional
    public PerformanceReviewResponse createReview(
        CreatePerformanceReviewRequest request,
        Authentication authentication
    ) {
        validateCompanyAccess(request.getCompanyId(), authentication);

        if (request.getReviewPeriodEnd().isBefore(request.getReviewPeriodStart())) {
            throw new IllegalArgumentException("Review period end cannot be before start");
        }

        if (performanceReviewRepository.existsOverlappingReview(
            request.getEmployeeId(),
            request.getReviewPeriodStart(),
            request.getReviewPeriodEnd()
        )) {
            throw new IllegalStateException("Employee already has a review overlapping this period");
        }

        Company company = companyRepository.findById(request.getCompanyId())
            .orElseThrow(() -> new IllegalArgumentException("Company not found"));

        Employee employee = employeeRepository.findById(request.getEmployeeId())
            .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        // reviewer is a User (HR), not an Employee
        User reviewer = userRepository.findById(request.getReviewerId())
            .orElseThrow(() -> new IllegalArgumentException("Reviewer user not found"));

        PerformanceReview review = PerformanceReview.builder()
            .company(company)
            .employee(employee)
            .reviewer(reviewer)
            .reviewPeriodStart(request.getReviewPeriodStart())
            .reviewPeriodEnd(request.getReviewPeriodEnd())
            .overallRating(request.getOverallRating())
            .strengths(request.getStrengths())
            .areasForImprovement(request.getAreasForImprovement())
            .goals(request.getGoals())
            .status("pending") // always starts pending
            .build();

        review = performanceReviewRepository.save(review);
        log.info("Created performance review for employee: {} period: {} to {}",
            employee.getFirstName() + " " + employee.getLastName(),
            request.getReviewPeriodStart(), request.getReviewPeriodEnd());
        return mapToResponse(review);
    }

    // ─── HR fills in details, then marks as reviewed ─────────────────────────

    @Transactional
    public PerformanceReviewResponse updateReview(
        UUID reviewId,
        UpdatePerformanceReviewRequest request,
        Authentication authentication
    ) {
        PerformanceReview review = performanceReviewRepository.findById(reviewId)
            .orElseThrow(() -> new IllegalArgumentException("Performance review not found"));

        validateCompanyAccess(review.getCompany().getId(), authentication);

        if ("acknowledged".equals(review.getStatus())) {
            throw new IllegalStateException("Cannot modify an acknowledged review");
        }

        if (request.getReviewPeriodStart() != null) review.setReviewPeriodStart(request.getReviewPeriodStart());
        if (request.getReviewPeriodEnd() != null) review.setReviewPeriodEnd(request.getReviewPeriodEnd());
        if (request.getOverallRating() != null) review.setOverallRating(request.getOverallRating());
        if (request.getStrengths() != null) review.setStrengths(request.getStrengths());
        if (request.getAreasForImprovement() != null) review.setAreasForImprovement(request.getAreasForImprovement());
        if (request.getGoals() != null) review.setGoals(request.getGoals());

        if ("reviewed".equals(request.getStatus())) {
            if (review.getOverallRating() == null) {
                throw new IllegalStateException("Cannot mark as reviewed without an overall rating");
            }
            review.setStatus("reviewed");
            review.setReviewedAt(OffsetDateTime.now());
        }

        review = performanceReviewRepository.save(review);
        log.info("Updated performance review: {} status: {}", reviewId, review.getStatus());
        return mapToResponse(review);
    }

    // ─── HR acknowledges that the employee was informed ──────────────────────

    @Transactional
    public PerformanceReviewResponse acknowledgeReview(
        UUID reviewId,
        UUID acknowledgedByUserId,
        Authentication authentication
    ) {
        PerformanceReview review = performanceReviewRepository.findById(reviewId)
            .orElseThrow(() -> new IllegalArgumentException("Performance review not found"));

        validateCompanyAccess(review.getCompany().getId(), authentication);

        if (!"reviewed".equals(review.getStatus())) {
            throw new IllegalStateException("Only reviewed performance reviews can be acknowledged");
        }

        User acknowledgedBy = userRepository.findById(acknowledgedByUserId)
            .orElseThrow(() -> new IllegalArgumentException("Acknowledging user not found"));

        review.setStatus("acknowledged");
        review.setAcknowledgedBy(acknowledgedBy);

        review = performanceReviewRepository.save(review);
        log.info("Performance review {} acknowledged by user {}", reviewId, acknowledgedByUserId);
        return mapToResponse(review);
    }

    // ─── Read operations ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PerformanceReviewResponse getReviewById(UUID reviewId, Authentication authentication) {
        PerformanceReview review = performanceReviewRepository.findById(reviewId)
            .orElseThrow(() -> new IllegalArgumentException("Performance review not found"));
        validateCompanyAccess(review.getCompany().getId(), authentication);
        return mapToResponse(review);
    }

    @Transactional(readOnly = true)
    public List<PerformanceReviewResponse> getReviewsByEmployee(
        UUID employeeId, Authentication authentication
    ) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        validateCompanyAccess(employee.getCompany().getId(), authentication);
        return performanceReviewRepository.findByEmployeeEmployeeId(employeeId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PerformanceReviewResponse> getReviewsByCompany(
        UUID companyId, Authentication authentication
    ) {
        validateCompanyAccess(companyId, authentication);
        return performanceReviewRepository.findByCompanyId(companyId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PerformanceReviewResponse> getReviewsByCompanyAndStatus(
        UUID companyId, String status, Authentication authentication
    ) {
        validateCompanyAccess(companyId, authentication);
        return performanceReviewRepository.findByCompanyIdAndStatus(companyId, status).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public void deleteReview(UUID reviewId, Authentication authentication) {
        PerformanceReview review = performanceReviewRepository.findById(reviewId)
            .orElseThrow(() -> new IllegalArgumentException("Performance review not found"));
        validateCompanyAccess(review.getCompany().getId(), authentication);
        if ("acknowledged".equals(review.getStatus())) {
            throw new IllegalStateException("Cannot delete an acknowledged review");
        }
        performanceReviewRepository.delete(review);
        log.info("Deleted performance review: {}", reviewId);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private void validateCompanyAccess(UUID companyId, Authentication authentication) {
        if (keycloakUserService.isSuperAdmin(authentication)) return;
        UUID userCompanyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (userCompanyId == null || !userCompanyId.equals(companyId)) {
            throw new SecurityException("Access denied");
        }
    }

    private PerformanceReviewResponse mapToResponse(PerformanceReview review) {
        PerformanceReviewResponse.EmployeeInfo employeeInfo = PerformanceReviewResponse.EmployeeInfo.builder()
            .employeeId(review.getEmployee().getEmployeeId())
            .fullName(review.getEmployee().getFirstName() + " " + review.getEmployee().getLastName())
            .jobTitle(review.getEmployee().getJobTitle())
            .department(review.getEmployee().getDepartment() != null
                ? review.getEmployee().getDepartment().getName() : null)
            .build();

        PerformanceReviewResponse.ReviewerInfo reviewerInfo = null;
        if (review.getReviewer() != null) {
            reviewerInfo = PerformanceReviewResponse.ReviewerInfo.builder()
                .userId(review.getReviewer().getId())
                .username(review.getReviewer().getUsername())
                .email(review.getReviewer().getEmail())
                .build();
        }

        return PerformanceReviewResponse.builder()
            .id(review.getId())
            .companyId(review.getCompany().getId())
            .employee(employeeInfo)
            .reviewer(reviewerInfo)
            .reviewPeriodStart(review.getReviewPeriodStart())
            .reviewPeriodEnd(review.getReviewPeriodEnd())
            .overallRating(review.getOverallRating())
            .strengths(review.getStrengths())
            .areasForImprovement(review.getAreasForImprovement())
            .goals(review.getGoals())
            .status(review.getStatus())
            .reviewedAt(review.getReviewedAt())
            .acknowledgedByName(review.getAcknowledgedBy() != null
                ? review.getAcknowledgedBy().getUsername() : null)
            .createdAt(review.getCreatedAt())
            .updatedAt(review.getUpdatedAt())
            .build();
    }
}


