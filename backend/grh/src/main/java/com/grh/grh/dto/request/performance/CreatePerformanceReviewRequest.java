package com.grh.grh.dto.request.performance;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
public class CreatePerformanceReviewRequest {

    private UUID companyId; // optional: only for super admins

    @NotNull(message = "Employee ID is required")
    private UUID employeeId;

    @NotNull(message = "Review period start is required")
    private LocalDate reviewPeriodStart;

    @NotNull(message = "Review period end is required")
    private LocalDate reviewPeriodEnd;

    // Optional on creation — filled when HR submits the review
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private Integer overallRating;

    private String strengths;
    private String areasForImprovement;
    private String goals;
    // Status is always "pending" on creation — no need to send it
}
