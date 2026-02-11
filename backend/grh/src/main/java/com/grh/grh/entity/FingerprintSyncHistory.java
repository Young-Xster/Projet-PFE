package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "fingerprint_sync_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = "device")
@ToString(exclude = "device")
public class FingerprintSyncHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private FingerprintIntegration device;

    @Column(name = "sync_start_at")
    @Builder.Default
    private OffsetDateTime syncStartAt = OffsetDateTime.now();

    @Column(name = "sync_end_at")
    private OffsetDateTime syncEndAt;

    @Column(name = "records_fetched")
    private Integer recordsFetched;

    @Column(name = "records_processed")
    private Integer recordsProcessed;

    @Column(name = "records_failed")
    private Integer recordsFailed;

    @Column(name = "sync_status", length = 50)
    @Builder.Default
    private String syncStatus = "success";

    @Column(name = "error_details", columnDefinition = "TEXT")
    private String errorDetails;
}