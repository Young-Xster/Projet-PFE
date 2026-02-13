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
public class PerformanceReviewDetailResponse {
    private UUID id;
    private EmployeeInfo employee;
    private ReviewerInfo reviewer;
    private String reviewPeriod;
    private LocalDate reviewDate;
    private BigDecimal overallScore;
    private String strengths;
    private String areasForImprovement;
    private String goals;
    private String comments;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeInfo {
        private UUID employeeId;
        private String fullName;
        private String email;
        private String department;
        private String position;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewerInfo {
        private UUID userId;
        private String fullName;
        private String email;
    }
}
