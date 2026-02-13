package com.grh.grh.repository;

import com.grh.grh.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    
    Optional<Department> findByCode(String code);

    Optional<Department> findByName(String name);

    boolean existsByCode(String code);

    boolean existsByName(String name);

    List<Department> findByCompanyId(UUID companyId);
    
    @Query("SELECT d FROM Department d WHERE d.parentDepartment.id = :parentId")
    List<Department> findSubdepartments(@Param("parentId") UUID parentId);
    
    @Query("SELECT d FROM Department d WHERE d.company.id = :companyId AND d.parentDepartment IS NULL")
    List<Department> findRootDepartments(@Param("companyId") UUID companyId);
    
    @Query("SELECT d FROM Department d LEFT JOIN FETCH d.employees WHERE d.id = :id")
    Optional<Department> findByIdWithEmployees(@Param("id") UUID id);

}
