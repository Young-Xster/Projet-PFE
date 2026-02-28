package com.grh.grh.repository;

import com.grh.grh.entity.SubcontractorReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubcontractorReviewRepository extends JpaRepository<SubcontractorReview, UUID> {
    List<SubcontractorReview> findBySubcontractorId(UUID subcontractorId);
    List<SubcontractorReview> findByCompanyId(UUID companyId);
    List<SubcontractorReview> findByCompanyIdAndStatus(UUID companyId, String status);

    Optional<SubcontractorReview> findBySubcontractorIdAndReviewMonthAndReviewYear(
        UUID subcontractorId, Integer month, Integer year
    );

    // All active subcontractors needing review this month
    List<SubcontractorReview> findByCompanyIdAndReviewMonthAndReviewYear(
        UUID companyId, Integer month, Integer year
    );
}