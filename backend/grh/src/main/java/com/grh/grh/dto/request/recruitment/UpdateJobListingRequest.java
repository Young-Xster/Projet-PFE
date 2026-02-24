package com.grh.grh.dto.request.recruitment;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateJobListingRequest {

    private UUID positionId;
    private UUID departmentId;

    private String title;
    private String description;
    private String requirements;
    private String employmentType;

    private BigDecimal salaryMin;
    private BigDecimal salaryMax;

    private Integer numberOfPositions;
    private LocalDate deadline;
}