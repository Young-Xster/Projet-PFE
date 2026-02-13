package com.grh.grh.repository;

import com.grh.grh.entity.PerformanceMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface PerformanceMetricRepository extends JpaRepository<PerformanceMetric, UUID> {
    
    List<PerformanceMetric> findByEmployeeEmployeeId(UUID employeeId);
    
    List<PerformanceMetric> findByCompanyId(UUID companyId);
    
    List<PerformanceMetric> findByMetricType(String metricType);
    
    @Query("SELECT pm FROM PerformanceMetric pm WHERE pm.employee.employeeId = :employeeId AND pm.periodStart >= :startDate AND pm.periodEnd <= :endDate")
    List<PerformanceMetric> findByEmployeeAndPeriod(
        @Param("employeeId") UUID employeeId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    List<PerformanceMetric> findByAiCalculated(Boolean aiCalculated);
}
