package com.grh.grh.dto.response.subcontractor;

import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubcontractorReviewResponse {
    private UUID id;
    private UUID subcontractorId;
    private String subcontractorDisplayName;
    private UUID reviewerId;
    private Integer reviewMonth;
    private Integer reviewYear;

    // 10 criteria
    private Integer qualityOfWork;
    private Integer timelinessReliability;
    private Integer communication;
    private Integer complianceDocumentation;
    private Integer professionalismConduct;
    private Integer costManagement;
    private Integer healthSafetySecurity;
    private Integer flexibilityProblemSolving;
    private Integer collaborationTeamwork;
    private Integer innovationValueAdded;

    private BigDecimal overallScore;
    private String hrNotes;
    private String aiNotes;
    private String status;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}