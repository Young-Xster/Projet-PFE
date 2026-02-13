package com.grh.grh.dto.request.performance;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePerformanceReviewRequest {
    
    private LocalDate reviewDate;
    
    @Min(value = 0)
    @Max(value = 100)
    private BigDecimal overallScore;
    
    private String strengths;
    
    private String areasForImprovement;
    
    private String goals;
    
    private String comments;
    
    private String status;
}
