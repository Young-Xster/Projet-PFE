package com.grh.grh.repository;

import com.grh.grh.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, UUID> {
    
    List<AttendanceRecord> findByEmployeeEmployeeId(UUID employeeId);
    
    List<AttendanceRecord> findByDate(LocalDate date);
    
    List<AttendanceRecord> findByCompanyIdAndDate(UUID companyId, LocalDate date);
    
    @Query("SELECT a FROM AttendanceRecord a WHERE a.employee.employeeId = :employeeId AND a.date BETWEEN :startDate AND :endDate")
    List<AttendanceRecord> findByEmployeeAndDateRange(
        @Param("employeeId") UUID employeeId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    @Query("SELECT a FROM AttendanceRecord a WHERE a.company.id = :companyId AND a.date BETWEEN :startDate AND :endDate")
    List<AttendanceRecord> findByCompanyAndDateRange(
        @Param("companyId") UUID companyId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    Optional<AttendanceRecord> findByEmployeeEmployeeIdAndDate(UUID employeeId, LocalDate date);
    
    @Query("SELECT a FROM AttendanceRecord a WHERE a.status = :status")
    List<AttendanceRecord> findByStatus(@Param("status") String status);
}