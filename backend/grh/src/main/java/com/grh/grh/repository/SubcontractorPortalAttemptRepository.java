package com.grh.grh.repository;

import com.grh.grh.entity.SubcontractorPortalAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SubcontractorPortalAttemptRepository extends JpaRepository<SubcontractorPortalAttempt, UUID> {
}
