package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "company_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = "company")
@ToString(exclude = "company")
public class CompanySetting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", unique = true, nullable = false)
    private Company company;

    @Column(name = "work_hours_start", nullable = false)
    private LocalTime workHoursStart;

    @Column(name = "work_hours_end", nullable = false)
    private LocalTime workHoursEnd;

    @Column(name = "grace_period_minutes")
    private Integer gracePeriodMinutes;

    @Column(length = 10)
    @Builder.Default
    private String currency = "TND";

    @Column(name = "date_format", length = 20)
    @Builder.Default
    private String dateFormat = "DD-MM-YYYY";

    @Column(length = 50)
    @Builder.Default
    private String timezone = "Africa/Tunis";
}
