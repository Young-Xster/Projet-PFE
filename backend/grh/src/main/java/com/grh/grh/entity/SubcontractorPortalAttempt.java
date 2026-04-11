package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "subcontractor_portal_attempts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"company", "subcontractor"})
@EqualsAndHashCode(exclude = {"company", "subcontractor"})
public class SubcontractorPortalAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subcontractor_id")
    private Subcontractor subcontractor;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(nullable = false, length = 20)
    private String outcome;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
