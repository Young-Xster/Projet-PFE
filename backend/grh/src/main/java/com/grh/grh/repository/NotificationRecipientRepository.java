package com.grh.grh.repository;

import com.grh.grh.entity.NotificationRecipient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRecipientRepository extends JpaRepository<NotificationRecipient, UUID> {

    @Query("""
        SELECT nr FROM NotificationRecipient nr
        JOIN FETCH nr.notification n
        JOIN FETCH n.company c
        WHERE nr.user.id = :userId
        ORDER BY n.createdAt DESC
    """)
    List<NotificationRecipient> findByUserIdOrderByNotificationCreatedAtDesc(@Param("userId") UUID userId);

    long countByUserIdAndIsReadFalse(UUID userId);

    Optional<NotificationRecipient> findByNotificationIdAndUserId(UUID notificationId, UUID userId);

    @Modifying
    @Query("""
        UPDATE NotificationRecipient nr
        SET nr.isRead = true, nr.readAt = CURRENT_TIMESTAMP
        WHERE nr.user.id = :userId AND nr.isRead = false
    """)
    void markAllReadByUserId(@Param("userId") UUID userId);
}
