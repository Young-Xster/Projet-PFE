package com.grh.grh.repository;

import com.grh.grh.entity.RecruitmentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RecruitmentRequestRepository extends JpaRepository<RecruitmentRequest, UUID> {
    
    List<RecruitmentRequest> findByCompanyId(UUID companyId);
    
    List<RecruitmentRequest> findByStatus(String status);
    
    List<RecruitmentRequest> findByCompanyIdAndStatus(UUID companyId, String status);
    
    List<RecruitmentRequest> findByPositionId(UUID positionId);
    
    List<RecruitmentRequest> findByDepartmentId(UUID departmentId);
    
    @Query("SELECT rr FROM RecruitmentRequest rr LEFT JOIN FETCH rr.candidates WHERE rr.id = :id")
    java.util.Optional<RecruitmentRequest> findByIdWithCandidates(@Param("id") UUID id);
}
