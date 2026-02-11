package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Entity
@Table(name = "recruitment_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"company", "position", "requestedBy", "department", "approvedBy", "candidates"})
@ToString(exclude = {"company", "position", "requestedBy", "department", "approvedBy", "candidates"})
public class RecruitmentRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id")
    private Position position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by")
    private User requestedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "number_of_positions", nullable = false)
    private Integer numberOfPositions;

    @Column(name = "urgency_level", length = 50)
    @Builder.Default
    private String urgencyLevel = "low";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "required_skills", columnDefinition = "jsonb")
    private Map<String, Object> requiredSkills;

    @Column(name = "required_experience_years")
    private Integer requiredExperienceYears;

    @Column(name = "job_description", columnDefinition = "TEXT")
    private String jobDescription;

    @Column(name = "employment_type", nullable = false, length = 50)
    private String employmentType;

    @Column(length = 50)
    @Builder.Default
    private String status = "open";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;

    @Column
    private LocalDate deadline;

    // Relationships
    @OneToMany(mappedBy = "recruitmentRequest", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Candidate> candidates = new HashSet<>();
}