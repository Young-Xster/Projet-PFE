package com.grh.grh.repository;

import com.grh.grh.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, UUID> {
    
    Optional<Candidate> findByEmail(String email);
    
    List<Candidate> findByRecruitmentRequestId(UUID recruitmentRequestId);
    
    List<Candidate> findByStatus(String status);
    
    List<Candidate> findByCompanyId(UUID companyId);
    
    @Query("SELECT c FROM Candidate c WHERE c.recruitmentRequest.id = :requestId AND c.status = :status")
    List<Candidate> findByRecruitmentRequestIdAndStatus(
        @Param("requestId") UUID requestId,
        @Param("status") String status
    );
    
    @Query("SELECT c FROM Candidate c LEFT JOIN FETCH c.skills WHERE c.id = :id")
    Optional<Candidate> findByIdWithSkills(@Param("id") UUID id);
}
