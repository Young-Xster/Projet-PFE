package com.grh.grh.repository;

import com.grh.grh.entity.PerformanceReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface PerformanceReviewRepository extends JpaRepository<PerformanceReview, UUID> {
    
    List<PerformanceReview> findByEmployeeEmployeeId(UUID employeeId);
    
    List<PerformanceReview> findByStatus(String status);
    
    List<PerformanceReview> findByCompanyId(UUID companyId);
    
    @Query("SELECT pr FROM PerformanceReview pr WHERE pr.employee.employeeId = :employeeId AND pr.reviewPeriodStart >= :startDate AND pr.reviewPeriodEnd <= :endDate")
    List<PerformanceReview> findByEmployeeAndPeriod(
        @Param("employeeId") UUID employeeId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}
