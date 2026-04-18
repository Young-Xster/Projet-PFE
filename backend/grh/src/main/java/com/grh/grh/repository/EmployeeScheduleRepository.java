package com.grh.grh.repository;

import com.grh.grh.entity.EmployeeSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeScheduleRepository extends JpaRepository<EmployeeSchedule, UUID> {
    
    List<EmployeeSchedule> findByEmployeeEmployeeId(UUID employeeId);
    
    List<EmployeeSchedule> findByScheduleId(UUID scheduleId);
    
    @Query("SELECT es FROM EmployeeSchedule es JOIN FETCH es.schedule s JOIN FETCH s.scheduleDetails WHERE es.employee.employeeId = :employeeId AND es.effectiveFrom <= :date AND (es.effectiveTo IS NULL OR es.effectiveTo >= :date)")
    Optional<EmployeeSchedule> findActiveScheduleForEmployee(
        @Param("employeeId") UUID employeeId,
        @Param("date") LocalDate date
    );

    @Query("SELECT DISTINCT es.employee.employeeId FROM EmployeeSchedule es WHERE es.employee IS NOT NULL AND es.employee.company.id = :companyId AND es.effectiveFrom <= :date AND (es.effectiveTo IS NULL OR es.effectiveTo >= :date)")
    List<UUID> findActiveEmployeeIdsByCompanyAndDate(
        @Param("companyId") UUID companyId,
        @Param("date") LocalDate date
    );
}
