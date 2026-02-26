package com.grh.grh.dto.request.performance;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePerformanceReviewRequest {

    private LocalDate reviewPeriodStart;
    private LocalDate reviewPeriodEnd;

    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private Integer overallRating;

    private String strengths;
    private String areasForImprovement;
    private String goals;

    // Set to "reviewed" when HR has finished filling the review
    // Set to "acknowledged" via the dedicated /acknowledge endpoint instead
    private String status;
}
