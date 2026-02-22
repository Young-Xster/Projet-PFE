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
public interface AttendanceRepository extends JpaRepository<AttendanceRecord, UUID> {

    List<AttendanceRecord> findByCompanyId(UUID companyId);

    List<AttendanceRecord> findByEmployeeEmployeeId(UUID employeeId);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.employee.employeeId = :employeeId " +
           "AND a.date BETWEEN :startDate AND :endDate")
    List<AttendanceRecord> findByEmployeeAndDateRange(
        @Param("employeeId") UUID employeeId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT a FROM AttendanceRecord a WHERE a.company.id = :companyId " +
           "AND a.date BETWEEN :startDate AND :endDate")
    List<AttendanceRecord> findByCompanyAndDateRange(
        @Param("companyId") UUID companyId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT a FROM AttendanceRecord a WHERE a.company.id = :companyId AND a.date = :date")
    List<AttendanceRecord> findByCompanyAndDate(
        @Param("companyId") UUID companyId,
        @Param("date") LocalDate date
    );

    Optional<AttendanceRecord> findByEmployeeEmployeeIdAndDate(UUID employeeId, LocalDate date);

    List<AttendanceRecord> findByCompanyIdAndStatus(UUID companyId, String status);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.subcontractor.id = :subcontractorId " +
           "AND a.date BETWEEN :startDate AND :endDate")
    List<AttendanceRecord> findBySubcontractorAndDateRange(
        @Param("subcontractorId") UUID subcontractorId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}