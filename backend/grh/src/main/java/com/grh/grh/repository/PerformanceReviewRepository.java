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

    List<PerformanceReview> findByCompanyIdAndStatus(UUID companyId, String status);

    // reviewer is a User, not an Employee
    List<PerformanceReview> findByReviewerId(UUID reviewerUserId);

    @Query("SELECT pr FROM PerformanceReview pr WHERE pr.employee.employeeId = :employeeId " +
           "AND pr.reviewPeriodStart >= :startDate AND pr.reviewPeriodEnd <= :endDate")
    List<PerformanceReview> findByEmployeeAndPeriod(
        @Param("employeeId") UUID employeeId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT pr FROM PerformanceReview pr WHERE pr.employee.employeeId = :employeeId " +
           "AND pr.status = :status")
    List<PerformanceReview> findByEmployeeAndStatus(
        @Param("employeeId") UUID employeeId,
        @Param("status") String status
    );

    @Query("SELECT pr FROM PerformanceReview pr WHERE pr.company.id = :companyId " +
           "AND pr.reviewPeriodStart >= :startDate AND pr.reviewPeriodEnd <= :endDate")
    List<PerformanceReview> findByCompanyAndPeriod(
        @Param("companyId") UUID companyId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT CASE WHEN COUNT(pr) > 0 THEN true ELSE false END FROM PerformanceReview pr " +
           "WHERE pr.employee.employeeId = :employeeId " +
           "AND pr.reviewPeriodStart <= :periodEnd AND pr.reviewPeriodEnd >= :periodStart " +
           "AND pr.status != 'cancelled'")
    boolean existsOverlappingReview(
        @Param("employeeId") UUID employeeId,
        @Param("periodStart") LocalDate periodStart,
        @Param("periodEnd") LocalDate periodEnd
    );
}
