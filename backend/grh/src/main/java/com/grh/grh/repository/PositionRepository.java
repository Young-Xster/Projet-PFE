package com.grh.grh.repository;

import com.grh.grh.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PositionRepository extends JpaRepository<Position, UUID> {
    
    Optional<Position> findByCode(String code);
    
    List<Position> findByCompanyId(UUID companyId);
    
    List<Position> findByDepartmentId(UUID departmentId);
    
    boolean existsByCode(String code);
}