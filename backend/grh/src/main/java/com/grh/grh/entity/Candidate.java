package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "candidates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"company", "recruitmentRequest", "skills", "interviewStages"})
@ToString(exclude = {"company", "recruitmentRequest", "skills", "interviewStages"})
public class Candidate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recruitment_request_id", nullable = false)
    private RecruitmentRequest recruitmentRequest;

    @Column(name = "first_name", nullable = false, length = 255)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 255)
    private String lastName;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(name = "resume_path", length = 255)
    private String resumePath;

    @Column(name = "cover_letter_path", length = 255)
    private String coverLetterPath;

    @Column(name = "linked_in_profile", length = 255)
    private String linkedInProfile;

    @Column(name = "portfolio_url", length = 255)
    private String portfolioUrl;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "current_position", length = 255)
    private String currentPosition;

    @Column(name = "expected_salary", precision = 12, scale = 2)
    private BigDecimal expectedSalary;

    @Column(name = "application_date")
    @Builder.Default
    private OffsetDateTime applicationDate = OffsetDateTime.now();

    @Column(length = 50)
    @Builder.Default
    private String source = "other";

    @Column(name = "ai_match_score", precision = 5, scale = 2)
    private BigDecimal aiMatchScore;

    @Column(length = 50)
    @Builder.Default
    private String status = "new";

    // Relationships
    @OneToMany(mappedBy = "candidate", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<CandidateSkill> skills = new HashSet<>();

    @OneToMany(mappedBy = "candidate", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<InterviewStage> interviewStages = new HashSet<>();
}