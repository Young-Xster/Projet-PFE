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

    // Find by ID with all relationships (excluding terminated)
    @Query("SELECT e FROM Employee e " +
           "LEFT JOIN FETCH e.company " +
           "LEFT JOIN FETCH e.department " +
           "LEFT JOIN FETCH e.manager " +
           "LEFT JOIN FETCH e.user " +
           "WHERE e.employeeId = :id AND e.status != 'terminated'")
    Optional<Employee> findByIdWithDetails(@Param("id") UUID id);

    // Find by company ID (excluding terminated)
    @Query("SELECT e FROM Employee e WHERE e.company.id = :companyId AND e.status != 'terminated'")
    List<Employee> findByCompanyId(@Param("companyId") UUID companyId);

    // Find by department ID (excluding terminated)
    @Query("SELECT e FROM Employee e WHERE e.department.id = :departmentId AND e.status != 'terminated'")
    List<Employee> findByDepartmentId(@Param("departmentId") UUID departmentId);

    // Find by company and status
    @Query("SELECT e FROM Employee e WHERE e.company.id = :companyId AND e.status = :status")
    List<Employee> findByCompanyIdAndStatus(@Param("companyId") UUID companyId, @Param("status") String status);

    // Check if email exists (excluding terminated)
    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM Employee e " +
           "WHERE e.email = :email AND e.status != 'terminated'")
    boolean existsByEmail(@Param("email") String email);

    // Check if national ID exists (excluding terminated)
    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM Employee e " +
           "WHERE e.nationalId = :nationalId AND e.status != 'terminated'")
    boolean existsByNationalId(@Param("nationalId") String nationalId);

    // Find by employee ID (excluding terminated)
    @Query("SELECT e FROM Employee e WHERE e.employeeId = :employeeId AND e.status != 'terminated'")
    Optional<Employee> findByEmployeeId(@Param("employeeId") UUID employeeId);

    // Find all including terminated (for admin purposes)
    @Query("SELECT e FROM Employee e " +
           "LEFT JOIN FETCH e.company " +
           "LEFT JOIN FETCH e.department " +
           "WHERE e.company.id = :companyId")
    List<Employee> findAllByCompanyIdIncludingTerminated(@Param("companyId") UUID companyId);

    // Search employees by name or email (excluding terminated)
    @Query("SELECT e FROM Employee e WHERE e.company.id = :companyId " +
           "AND e.status != 'terminated' " +
           "AND (LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Employee> searchEmployees(@Param("companyId") UUID companyId, @Param("search") String search);

    // Count active employees
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.company.id = :companyId AND e.status != 'terminated'")
    long countActiveEmployees(@Param("companyId") UUID companyId);
}
