package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "document_access_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"document", "accessedBy"})
@ToString(exclude = {"document", "accessedBy"})
public class DocumentAccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private EmployeeDocument document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accessed_by")
    private User accessedBy;

    @Column(name = "access_time")
    @Builder.Default
    private OffsetDateTime accessTime = OffsetDateTime.now();

    @Column(name = "access_type", nullable = false, length = 50)
    private String accessType;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;
}