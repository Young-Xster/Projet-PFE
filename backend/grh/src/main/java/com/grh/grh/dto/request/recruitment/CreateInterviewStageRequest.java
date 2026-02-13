package com.grh.grh.dto.request.recruitment;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInterviewStageRequest {
    
    @NotNull(message = "Company ID is required")
    private UUID companyId;
    
    @NotNull(message = "Candidate ID is required")
    private UUID candidateId;
    
    @NotBlank(message = "Stage name is required")
    @Size(max = 255)
    private String stageName;
    
    @NotNull(message = "Stage number is required")
    @Min(value = 1, message = "Stage number must be at least 1")
    private Integer stageNumber;
    
    private OffsetDateTime scheduledAt;
    
    @NotNull(message = "Interviewer ID is required")
    private UUID interviewerId; // User ID
    
    @NotBlank(message = "Status is required")
    private String status; // scheduled, completed, cancelled
}
