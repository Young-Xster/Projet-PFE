package com.grh.grh.repository;

import com.grh.grh.entity.ShiftAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ShiftAssignmentRepository extends JpaRepository<ShiftAssignment, UUID> {

    List<ShiftAssignment> findByEmployeeEmployeeId(UUID employeeId);

    List<ShiftAssignment> findByShiftDate(LocalDate shiftDate);

    @Query("SELECT sa FROM ShiftAssignment sa WHERE sa.employee.employeeId = :employeeId AND sa.shiftDate BETWEEN :startDate AND :endDate")
    List<ShiftAssignment> findByEmployeeAndDateRange(
        @Param("employeeId") UUID employeeId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    List<ShiftAssignment> findByStatus(String status);
}