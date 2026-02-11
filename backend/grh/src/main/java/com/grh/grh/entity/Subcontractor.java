package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "subcontractors")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"company", "attendanceRecords"})
@ToString(exclude = {"company", "attendanceRecords"})
public class Subcontractor extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "subcontractor_code", nullable = false, unique = true, length = 255)
    private String subcontractorCode;

    @Column(name = "company_name", nullable = false, length = 255)
    private String companyName;

    @Column(name = "contact_first_name", nullable = false, length = 255)
    private String contactFirstName;

    @Column(name = "contact_last_name", nullable = false, length = 255)
    private String contactLastName;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(name = "contract_start_date", nullable = false)
    private LocalDate contractStartDate;

    @Column(name = "contract_end_date", nullable = false)
    private LocalDate contractEndDate;

    @Column(name = "contract_type", nullable = false, length = 50)
    private String contractType;

    @Column(name = "hourly_rate", nullable = false, precision = 12, scale = 2)
    private BigDecimal hourlyRate;

    @Column(length = 50)
    @Builder.Default
    private String status = "active";

    // Relationships
    @OneToMany(mappedBy = "subcontractor", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<AttendanceRecord> attendanceRecords = new HashSet<>();
}