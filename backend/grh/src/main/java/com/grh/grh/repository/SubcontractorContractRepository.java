package com.grh.grh.repository;

import com.grh.grh.entity.SubcontractorContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubcontractorContractRepository extends JpaRepository<SubcontractorContract, UUID> {

    List<SubcontractorContract> findBySubcontractorId(UUID subcontractorId);
    Optional<SubcontractorContract> findBySubcontractorIdAndStatus(UUID subcontractorId, String status);

    // Contracts expiring within X days (for notifications)
    @Query("SELECT c FROM SubcontractorContract c WHERE c.status = 'ACTIVE' " +
           "AND c.endDate BETWEEN :today AND :targetDate")
    List<SubcontractorContract> findContractsExpiringBefore(
        @Param("today") LocalDate today,
        @Param("targetDate") LocalDate targetDate
    );

    // Auto-expire passed contracts
    @Query("SELECT c FROM SubcontractorContract c WHERE c.status = 'ACTIVE' AND c.endDate < :today")
    List<SubcontractorContract> findExpiredContracts(@Param("today") LocalDate today);
    
}
