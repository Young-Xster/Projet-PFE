package com.grh.grh.repository;

import com.grh.grh.entity.Subcontractor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubcontractorRepository extends JpaRepository<Subcontractor, UUID> {

    List<Subcontractor> findByCompanyId(UUID companyId);

    List<Subcontractor> findByCompanyIdAndStatus(UUID companyId, String status);

    boolean existsByContactEmailAndCompanyId(String contactEmail, UUID companyId);

    Optional<Subcontractor> findByContactEmailAndCompanyId(String contactEmail, UUID companyId);

    Optional<Subcontractor> findByCompanyIdAndContactEmailIgnoreCase(UUID companyId, String contactEmail);

    Optional<Subcontractor> findFirstByContactEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(
        String contactEmail,
        String status
    );
}