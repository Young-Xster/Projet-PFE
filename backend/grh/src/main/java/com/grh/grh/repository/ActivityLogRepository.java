package com.grh.grh.repository;

import com.grh.grh.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
    
    List<ActivityLog> findByCompanyId(UUID companyId);
    
    List<ActivityLog> findByUserId(UUID userId);
    
    List<ActivityLog> findByEntityType(String entityType);
    
    List<ActivityLog> findByEntityId(UUID entityId);
    
    @Query("SELECT al FROM ActivityLog al WHERE al.createdAt BETWEEN :startDate AND :endDate")
    List<ActivityLog> findByCreatedAtBetween(
        @Param("startDate") OffsetDateTime startDate,
        @Param("endDate") OffsetDateTime endDate
    );
    
    @Query("SELECT al FROM ActivityLog al WHERE al.user.id = :userId AND al.createdAt BETWEEN :startDate AND :endDate ORDER BY al.createdAt DESC")
    List<ActivityLog> findUserActivityBetween(
        @Param("userId") UUID userId,
        @Param("startDate") OffsetDateTime startDate,
        @Param("endDate") OffsetDateTime endDate
    );
}
