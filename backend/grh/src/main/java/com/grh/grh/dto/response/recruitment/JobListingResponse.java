package com.grh.grh.dto.response.recruitment;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobListingResponse {

    private UUID id;

    private UUID companyId;
    private String companyName;

    private UUID positionId;
    private String positionTitle;

    private UUID departmentId;
    private String departmentName;

    private String title;
    private String description;
    private String requirements;
    private String employmentType;

    private BigDecimal salaryMin;
    private BigDecimal salaryMax;

    private Integer numberOfPositions;
    private LocalDate deadline;
    private String status; 

    private Integer totalCandidates;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}