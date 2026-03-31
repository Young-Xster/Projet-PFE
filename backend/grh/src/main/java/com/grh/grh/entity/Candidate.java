package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "candidates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Candidate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_listing_id")
    private JobListing jobListing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recruitment_request_id")
    private RecruitmentRequest recruitmentRequest;

    // ─── Personal info ────────────────────────────────────────────────────
    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    private String email;

    private String phone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(columnDefinition = "TEXT")
    private String address;

    private String city;

    // ─── Background ───────────────────────────────────────────────────────
    @Column(name = "education_level")
    private String educationLevel;
    // Values: no_formal_education, primary, secondary, vocational, university, master_plus

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "previous_employer")
    private String previousEmployer;

    @Column(name = "skills", columnDefinition = "TEXT")
    private String skills; // free text, comma-separated

    @Column(name = "languages_spoken")
    private String languagesSpoken; // comma-separated

    @Column(name = "availability_date")
    private LocalDate availabilityDate;

    // ─── File uploads ──────────────────────────────────────────────────────
    @Column(name = "cv_file_path")
    private String cvFilePath;

    @Column(name = "recommendation_letter_path")
    private String recommendationLetterPath;

    @Column(name = "certificates_paths", columnDefinition = "TEXT")
    private String certificatesPaths; // comma-separated file paths

    // ─── Stage tracking ────────────────────────────────────────────────────
    @Column(name = "current_stage")
    @Builder.Default
    private Integer currentStage = 1;

    @Builder.Default
    private String status = "stage_1";
    // Values: stage_1, stage_2, accepted, rejected

    @Column(name = "rejected_at_stage")
    private Integer rejectedAtStage; // 1 or 2, null if not rejected

    @Column(name = "hr_notes", columnDefinition = "TEXT")
    private String hrNotes;

    // ─── Hiring link ───────────────────────────────────────────────────────
    @Column(name = "hired_employee_id")
    private UUID hiredEmployeeId;

    // ─── AI (stub for later) ───────────────────────────────────────────────
    @Column(name = "ai_match_score")
    private BigDecimal aiMatchScore;
    
    @Column(name = "ai_match_reasoning", columnDefinition = "TEXT")
    private String aiMatchRationale;

    // ─── Timestamps ────────────────────────────────────────────────────────
    @Column(name = "applied_at")
    @Builder.Default
    private OffsetDateTime appliedAt = OffsetDateTime.now();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}