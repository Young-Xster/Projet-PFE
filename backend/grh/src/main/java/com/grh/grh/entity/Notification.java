package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private String type; // CONTRACT_EXPIRY, INVOICE_OVERDUE, REVIEW_DUE, AI_ALERT, SYSTEM

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "target_module")
    private String targetModule; // SUBCONTRACTOR, EMPLOYEE, ATTENDANCE, etc.

    @Column(name = "target_id")
    private UUID targetId; // navigate to this record when clicked

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String importance = "MEDIUM";

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
