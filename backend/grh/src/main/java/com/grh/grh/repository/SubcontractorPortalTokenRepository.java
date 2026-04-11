package com.grh.grh.repository;

import com.grh.grh.entity.SubcontractorPortalToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubcontractorPortalTokenRepository extends JpaRepository<SubcontractorPortalToken, UUID> {

    Optional<SubcontractorPortalToken> findByTokenHash(String tokenHash);

    List<SubcontractorPortalToken> findBySubcontractorIdAndTokenTypeAndRevokedAtIsNull(
        UUID subcontractorId,
        String tokenType
    );
}
