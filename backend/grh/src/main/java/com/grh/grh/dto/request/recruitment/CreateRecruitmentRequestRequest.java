package com.grh.grh.dto.request.recruitment;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRecruitmentRequestRequest {
    
    @NotNull(message = "Company ID is required")
    private UUID companyId;
    
    @NotNull(message = "Position ID is required")
    private UUID positionId;
    
    @NotNull(message = "Department ID is required")
    private UUID departmentId;
    
    @NotNull(message = "Number of positions is required")
    @Min(value = 1, message = "Number of positions must be at least 1")
    private Integer numberOfPositions;
    
    @NotBlank(message = "Priority is required")
    private String priority; // low, medium, high, urgent
    
    @NotNull(message = "Required by date is required")
    private LocalDate requiredByDate;
    
    @NotBlank(message = "Status is required")
    private String status; // open, in_progress, filled, cancelled
    
    private String jobDescription;
    
    private String requirements;
}
