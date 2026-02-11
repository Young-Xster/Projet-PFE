package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "employee_documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"employee", "company", "uploadedBy", "accessLogs"})
@ToString(exclude = {"employee", "company", "uploadedBy", "accessLogs"})
public class EmployeeDocument extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "document_type", nullable = false, length = 50)
    private String documentType;

    @Column(name = "document_name", nullable = false, length = 255)
    private String documentName;

    @Column(name = "document_path", nullable = false, length = 255)
    private String documentPath;

    @Column(name = "document_size", nullable = false)
    private Long documentSize;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "expiration_date")
    private LocalDate expirationDate;

    @Column(length = 50)
    @Builder.Default
    private String status = "valid";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    @Column(name = "uploaded_at")
    @Builder.Default
    private OffsetDateTime uploadedAt = OffsetDateTime.now();

    // Relationships
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL)
    @Builder.Default
    private java.util.Set<DocumentAccessLog> accessLogs = new java.util.HashSet<>();
}