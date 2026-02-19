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
    
    List<Department> findByCompanyId(UUID companyId);
    
    List<Department> findByParentDepartmentId(UUID parentDepartmentId);
    
    boolean existsByCode(String code);
    
    @Query("SELECT d FROM Department d LEFT JOIN FETCH d.manager WHERE d.id = :id")
    Optional<Department> findByIdWithManager(@Param("id") UUID id);
}