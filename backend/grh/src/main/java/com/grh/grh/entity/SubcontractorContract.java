package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;


@Entity
@Table(name = "subcontractor_contracts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"subcontractor", "invoices"})
@EqualsAndHashCode(exclude = {"subcontractor", "invoices"})
public class SubcontractorContract {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subcontractor_id", nullable = false)
    private Subcontractor subcontractor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "payment_type", nullable = false)
    private String paymentType;

    @Column(nullable = false)
    private BigDecimal amount;

    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "contract_document_path", nullable = false)
    private String contractDocumentPath;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SubcontractorInvoice> invoices = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
