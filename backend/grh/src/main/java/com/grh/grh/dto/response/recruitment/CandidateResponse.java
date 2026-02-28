package com.grh.grh.dto.response.recruitment;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateResponse {

    private UUID id;

    // Job listing info
    private UUID jobListingId;
    private String jobTitle;
    private String companyName;
    private String departmentName;

    // Personal info
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private String address;
    private String city;

    // Background
    private String educationLevel;
    private Integer experienceYears;
    private String previousEmployer;
    private String skills;
    private String languagesSpoken;
    private LocalDate availabilityDate;

    // Files
    private String cvFileUrl;
    private String recommendationLetterUrl;
    private List<String> certificateUrls;

    // Stage tracking
    private Integer currentStage;   // 1 or 2
    private String status;          // stage_1, stage_2, accepted, rejected
    private Integer rejectedAtStage;
    private String hrNotes;

    // Hiring
    private UUID hiredEmployeeId;

    // AI (stub)
    private BigDecimal aiMatchScore;

    private OffsetDateTime appliedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}