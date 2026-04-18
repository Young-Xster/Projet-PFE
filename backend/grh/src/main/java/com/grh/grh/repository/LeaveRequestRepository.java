package com.grh.grh.repository;

import com.grh.grh.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {
    
    List<LeaveRequest> findByEmployeeEmployeeId(UUID employeeId);
    
    List<LeaveRequest> findByStatus(String status);
    
    List<LeaveRequest> findByCompanyIdAndStatus(UUID companyId, String status);
    
    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee.employeeId = :employeeId AND lr.status = :status")
    List<LeaveRequest> findByEmployeeAndStatus(
        @Param("employeeId") UUID employeeId,
        @Param("status") String status
    );
    
    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.company.id = :companyId AND lr.startDate <= :endDate AND lr.endDate >= :startDate")
    List<LeaveRequest> findOverlappingLeaves(
        @Param("companyId") UUID companyId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT lr.employee.employeeId FROM LeaveRequest lr WHERE lr.company.id = :companyId AND lr.status = 'approved' AND lr.startDate <= :date AND lr.endDate >= :date")
    List<UUID> findEmployeeIdsOnLeaveForDate(
        @Param("companyId") UUID companyId,
        @Param("date") LocalDate date
    );
}