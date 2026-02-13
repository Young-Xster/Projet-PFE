package com.grh.grh.repository;

import com.grh.grh.entity.InterviewStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface InterviewStageRepository extends JpaRepository<InterviewStage, UUID> {
    
    List<InterviewStage> findByCandidateId(UUID candidateId);
    
    List<InterviewStage> findByStatus(String status);
    
    List<InterviewStage> findByCompanyId(UUID companyId);
    
    @Query("SELECT i FROM InterviewStage i WHERE i.candidate.id = :candidateId ORDER BY i.stageNumber")
    List<InterviewStage> findByCandidateIdOrderByStageNumber(@Param("candidateId") UUID candidateId);
    
    @Query("SELECT i FROM InterviewStage i WHERE i.scheduledAt BETWEEN :startDate AND :endDate")
    List<InterviewStage> findByScheduledAtBetween(
        @Param("startDate") OffsetDateTime startDate,
        @Param("endDate") OffsetDateTime endDate
    );
}
