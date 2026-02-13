package com.grh.grh.repository;

import com.grh.grh.entity.WorkSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkScheduleRepository extends JpaRepository<WorkSchedule, UUID> {
    
    List<WorkSchedule> findByCompanyId(UUID companyId);
    
    @Query("SELECT ws FROM WorkSchedule ws WHERE ws.company.id = :companyId AND ws.isDefault = true")
    Optional<WorkSchedule> findDefaultByCompanyId(@Param("companyId") UUID companyId);
    
    @Query("SELECT ws FROM WorkSchedule ws LEFT JOIN FETCH ws.scheduleDetails WHERE ws.id = :id")
    Optional<WorkSchedule> findByIdWithDetails(@Param("id") UUID id);
}