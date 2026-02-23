package com.grh.grh.dto.response.performance;

import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceReviewResponse {

    private UUID id;
    private UUID companyId;
    private EmployeeInfo employee;
    private ReviewerInfo reviewer;

    private LocalDate reviewPeriodStart;
    private LocalDate reviewPeriodEnd;
    
    // 1–5 score
    private Integer overallRating; 
    private String strengths;
    private String areasForImprovement;
    private String goals;

    // pending → reviewed → acknowledged
    private String status;

    private OffsetDateTime reviewedAt;
    private String acknowledgedByName;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeInfo {
        private UUID employeeId;
        private String fullName;
        private String jobTitle;
        private String department;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewerInfo {
        private UUID userId;       
        private String username;
        private String email;
    }
}
