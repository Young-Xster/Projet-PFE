package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "subcontractor_reviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"subcontractor"})
@EqualsAndHashCode(exclude = {"subcontractor"})
public class SubcontractorReview {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subcontractor_id", nullable = false)
    private Subcontractor subcontractor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "reviewer_id")
    private UUID reviewerId;

    @Column(name = "review_month", nullable = false)
    private Integer reviewMonth;

    @Column(name = "review_year", nullable = false)
    private Integer reviewYear;

    // 10 criteria (1-5 scale)

    @Column(name = "quality_of_work")
    private Integer qualityOfWork;

    @Column(name = "timeliness_reliability")
    private Integer timelinessReliability;

    private Integer communication;

    @Column(name = "compliance_documentation")
    private Integer complianceDocumentation;

    @Column(name = "professionalism_conduct")
    private Integer professionalismConduct;

    @Column(name = "cost_management")
    private Integer costManagement;

    @Column(name = "health_safety_security")
    private Integer healthSafetySecurity;

    @Column(name = "flexibility_problem_solving")
    private Integer flexibilityProblemSolving;

    @Column(name = "collaboration_teamwork")
    private Integer collaborationTeamwork;

    @Column(name = "innovation_value_added")
    private Integer innovationValueAdded;

    @Column(name = "overall_score")
    private BigDecimal overallScore;

    @Column(name = "hr_notes", columnDefinition = "TEXT")
    private String hrNotes;

    @Column(name = "ai_notes", columnDefinition = "TEXT")
    private String aiNotes;

    @Builder.Default
    private String status = "DRAFT";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
