package com.grh.grh.repository;

import com.grh.grh.entity.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, UUID> {
    
    List<LeaveBalance> findByEmployeeEmployeeId(UUID employeeId);
    
    Optional<LeaveBalance> findByEmployeeEmployeeIdAndLeaveTypeIdAndYear(
        UUID employeeId, 
        UUID leaveTypeId, 
        Integer year
    );
    
    @Query("SELECT lb FROM LeaveBalance lb WHERE lb.employee.employeeId = :employeeId AND lb.year = :year")
    List<LeaveBalance> findByEmployeeAndYear(
        @Param("employeeId") UUID employeeId,
        @Param("year") Integer year
    );
}