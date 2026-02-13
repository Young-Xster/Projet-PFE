package com.grh.grh.dto.request.performance;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePerformanceReviewRequest {
    
    @NotNull(message = "Employee ID is required")
    private UUID employeeId;
    
    @NotNull(message = "Company ID is required")
    private UUID companyId;
    
    @NotNull(message = "Reviewer ID is required")
    private UUID reviewerId; // User ID
    
    @NotBlank(message = "Review period is required")
    @Size(max = 50)
    private String reviewPeriod; // Q1_2024, Annual_2024, etc.
    
    @NotNull(message = "Review date is required")
    private LocalDate reviewDate;
    
    @NotNull(message = "Overall score is required")
    @Min(value = 0, message = "Score must be between 0 and 100")
    @Max(value = 100, message = "Score must be between 0 and 100")
    private BigDecimal overallScore;
    
    private String strengths;
    
    private String areasForImprovement;
    
    private String goals;
    
    private String comments;
    
    @NotBlank(message = "Status is required")
    private String status; // draft, submitted, approved
}
