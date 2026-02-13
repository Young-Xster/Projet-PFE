package com.grh.grh.repository;

import com.grh.grh.entity.CompanySetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanySettingRepository extends JpaRepository<CompanySetting, UUID> {
    
    Optional<CompanySetting> findByCompanyId(UUID companyId);
    
    boolean existsByCompanyId(UUID companyId);
}
