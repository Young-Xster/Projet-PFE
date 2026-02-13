package com.grh.grh.repository;

import com.grh.grh.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    
    Optional<Employee> findByEmail(String email);

    Optional<Employee> findByNationalId(String nationalId);

    boolean existsByEmail(String email);

    boolean existsByNationalId(String nationalId);

    List<Employee> findByCompanyId(UUID companyId);

    List<Employee> findByDepartmentId(UUID departmentId);

    List<Employee> findByStatus(String status);

    @Query("SELECT e FROM Employee e WHERE e.company.id = :companyId AND e.status = :status")
    List<Employee> findByCompanyIdAndStatus(@Param("companyId") UUID companyId, @Param("status") String status);
    
    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.department LEFT JOIN FETCH e.manager WHERE e.id = :id")
    Optional<Employee> findByIdWithDetails(@Param("id") UUID id);
    
    @Query("SELECT e FROM Employee e WHERE e.manager.employeeId = :managerId")
    List<Employee> findSubordinates(@Param("managerId") UUID managerId);
    
    @Query("SELECT e FROM Employee e WHERE e.company.id = :companyId AND e.fingerprintId IS NOT NULL")
    List<Employee> findByCompanyIdWithFingerprint(@Param("companyId") UUID companyId);

}
