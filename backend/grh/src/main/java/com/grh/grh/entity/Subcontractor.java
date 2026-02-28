package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "subcontractors")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"contracts", "reviews"})
@EqualsAndHashCode(exclude = {"contracts", "reviews"})
public class Subcontractor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private String type; // INDIVIDUAL, COMPANY

    // ─── Individual fields ────────────────────────────────────────────────
    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    // ─── Company fields ───────────────────────────────────────────────────
    @Column(name = "company_name")
    private String companyName;

    @Column(name = "contact_first_name")
    private String contactFirstName;

    @Column(name = "contact_last_name")
    private String contactLastName;

    // ─── Common fields ─────────────────────────────────────────────────────
    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(columnDefinition = "TEXT")
    private String address;

    private String city;

    private String specialization;

    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    // ─── Relationships ─────────────────────────────────────────────────────
    @OneToMany(mappedBy = "subcontractor", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SubcontractorContract> contracts = new ArrayList<>();

    @OneToMany(mappedBy = "subcontractor", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SubcontractorReview> reviews = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}