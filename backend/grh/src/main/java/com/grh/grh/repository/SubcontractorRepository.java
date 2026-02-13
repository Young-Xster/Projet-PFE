package com.grh.grh.repository;

import com.grh.grh.entity.Subcontractor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubcontractorRepository extends JpaRepository<Subcontractor, UUID> {
    
    Optional<Subcontractor> findBySubcontractorCode(String subcontractorCode);

    Optional<Subcontractor> findByEmail(String email);

    List<Subcontractor> findByCompanyId(UUID companyId);

    List<Subcontractor> findByStatus(String status);

    boolean existsBySubcontractorCode(String subcontractorCode);
}
