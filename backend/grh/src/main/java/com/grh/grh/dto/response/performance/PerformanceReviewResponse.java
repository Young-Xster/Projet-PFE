package com.grh.grh.dto.response.performance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceReviewResponse {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private UUID reviewerId;
    private String reviewerName;
    private String reviewPeriod;
    private LocalDate reviewDate;
    private BigDecimal overallScore;
    private String status;
    private UUID companyId;
    private String companyName;
    private OffsetDateTime createdAt;
}
