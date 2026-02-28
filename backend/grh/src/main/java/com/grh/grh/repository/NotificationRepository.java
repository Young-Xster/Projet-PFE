package com.grh.grh.repository;

import com.grh.grh.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);
    List<Notification> findByCompanyIdAndIsReadFalseOrderByCreatedAtDesc(UUID companyId);
    long countByCompanyIdAndIsReadFalse(UUID companyId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.company.id = :companyId")
    void markAllReadByCompanyId(@Param("companyId") UUID companyId);

    // Prevent duplicate notifications on same day for same target
    boolean existsByCompanyIdAndTypeAndTargetId(UUID companyId, String type, UUID targetId);
}