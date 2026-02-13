package com.grh.grh.repository;

import com.grh.grh.entity.FingerprintIntegration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FingerprintIntegrationRepository extends JpaRepository<FingerprintIntegration, UUID> {
    
    Optional<FingerprintIntegration> findByDeviceId(String deviceId);
    
    Optional<FingerprintIntegration> findByDeviceCode(String deviceCode);
    
    List<FingerprintIntegration> findByCompanyId(UUID companyId);
    
    List<FingerprintIntegration> findByStatus(String status);
    
    boolean existsByDeviceId(String deviceId);
    
    boolean existsByDeviceCode(String deviceCode);
}
