package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Map;

@Entity
@Table(name = "attendance_records" , indexes = {
    @Index(name = "idx_attendance_employee_date" , columnList = "employee_id, date")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"company", "employee", "subcontractor", "approvedBy"})
@ToString(exclude = {"company", "employee", "subcontractor", "approvedBy"})
public class AttendanceRecord extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subcontractor_id")
    private Subcontractor subcontractor;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "clock_in_time")
    private OffsetDateTime clockInTime;

    @Column(name = "clock_out_time")
    private OffsetDateTime clockOutTime;

    @Column(length = 50)
    @Builder.Default
    private String status = "present";

    @Column(name = "delay_minutes")
    private Integer delayMinutes;

    @Column(name = "work_duration_minutes")
    private Integer workDurationMinutes;

    @Column(length = 50)
    @Builder.Default
    private String source = "manual";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "fingerprint_raw_data", columnDefinition = "jsonb")
    private Map<String, Object> fingerprintRawData;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;
}
