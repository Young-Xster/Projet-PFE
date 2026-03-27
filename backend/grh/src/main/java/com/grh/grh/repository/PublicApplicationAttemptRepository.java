package com.grh.grh.repository;

import com.grh.grh.entity.PublicApplicationAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PublicApplicationAttemptRepository extends JpaRepository<PublicApplicationAttempt, UUID> {
}
