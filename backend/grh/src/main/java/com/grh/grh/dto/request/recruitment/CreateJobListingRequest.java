package com.grh.grh.dto.request.recruitment;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateJobListingRequest {

    private UUID companyId; // optional: only for super admins

    private UUID positionId;    
    private UUID departmentId;  

    @NotBlank(message = "Job title is required")
    private String title;

    private String description;
    private String requirements;

    private String employmentType; 

    private BigDecimal salaryMin;
    private BigDecimal salaryMax;

    private Integer numberOfPositions;

    private LocalDate deadline;
}