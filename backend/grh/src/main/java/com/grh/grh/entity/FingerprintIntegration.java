package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Entity
@Table(name = "fingerprint_integration")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"company", "syncHistories"})
@ToString(exclude = {"company", "syncHistories"})
public class FingerprintIntegration extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "device_id", nullable = false, unique = true, length = 255)
    private String deviceId;

    @Column(name = "device_name", nullable = false, length = 255)
    private String deviceName;

    @Column(name = "device_code", nullable = false, unique = true, length = 255)
    private String deviceCode;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "connection_details", columnDefinition = "jsonb")
    private Map<String, Object> connectionDetails;

    @Column(length = 50)
    @Builder.Default
    private String status = "active";

    @Column(name = "last_sync_at")
    private OffsetDateTime lastSyncAt;

    // Relationships
    @OneToMany(mappedBy = "device", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<FingerprintSyncHistory> syncHistories = new HashSet<>();
}