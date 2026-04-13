package com.grh.grh.dto.response.performance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeePerformanceRatingResponse {
    private UUID employeeId;
    private String firstName;
    private String lastName;
    private String jobTitle;
    private String department;
    private String status;
    private String profileImage;

    // Attendance metrics (last 30 days)
    private int totalWorkingDays;
    private int presentDays;
    private int absentDays;
    private int lateArrivalsCount;
    private int totalLateMinutes;
    private int earlyDeparturesCount;
    private int totalEarlyDepartureMinutes;
    private int overtimeMinutes;
    private int sickLeaveDays;
    private int otherLeaveDays;
    private int totalLeaveDays;
    private double attendanceRate;

    // AI Rating
    private double score;
    private String reasoning;
    private String ratingMethod; // "ai" or "formula"
}
