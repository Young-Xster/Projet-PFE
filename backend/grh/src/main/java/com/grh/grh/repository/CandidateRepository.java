package com.grh.grh.repository;

import com.grh.grh.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, UUID> {

    List<Candidate> findByJobListingId(UUID jobListingId);

    List<Candidate> findByJobListingIdAndStatus(UUID jobListingId, String status);

    List<Candidate> findByJobListingIdAndCurrentStage(UUID jobListingId, Integer stage);

    List<Candidate> findByJobListingIdOrderByAiMatchScoreDesc(UUID jobListingId);

    @Query("SELECT COUNT(c) > 0 FROM Candidate c WHERE c.jobListing.id = :jobListingId AND lower(trim(c.email)) = :normalizedEmail")
    boolean existsByNormalizedEmailAndJobListingId(
        @Param("normalizedEmail") String normalizedEmail,
        @Param("jobListingId") UUID jobListingId
    );

    List<Candidate> findByEmail(String email);
}