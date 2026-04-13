package com.grh.grh.service;

import com.grh.grh.dto.response.performance.EmployeePerformanceRatingResponse;
import com.grh.grh.entity.AttendanceRecord;
import com.grh.grh.entity.Employee;
import com.grh.grh.entity.LeaveRequest;
import com.grh.grh.repository.AttendanceRepository;
import com.grh.grh.repository.EmployeeRepository;
import com.grh.grh.repository.LeaveRequestRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class EmployeePerformanceService {

    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:8082/api/v1}")
    private String aiServiceUrl;

    @Data
    @Builder
    public static class EmployeeMetric {
        private UUID employeeId;
        private String firstName;
        private String lastName;
        private String jobTitle;
        private String department;
        private String status;
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
        private String periodLabel;
    }

    @Data
    @Builder
    public static class AiPerformanceRequest {
        private List<EmployeeMetric> metrics;
    }

    @Data
    public static class AiPerformanceResponseResult {
        private UUID employeeId;
        private String firstName;
        private String lastName;
        private double score;
        private String reasoning;
    }

    @Data
    public static class AiPerformanceResponse {
        private List<AiPerformanceResponseResult> results;
    }

    public List<EmployeePerformanceRatingResponse> rateEmployeesInCompany(UUID companyId) {
        log.info("Starting performance rating for company: {}", companyId);

        // Get ACTIVE employees only - performance rating should not apply to terminated employees
        List<Employee> allEmployees = employeeRepository.findByCompanyId(companyId);
        log.info("Found {} active employees in company", allEmployees.size());

        if (allEmployees.isEmpty()) {
            log.info("No employees found for company {}", companyId);
            return List.of();
        }

        LocalDate endDate = LocalDate.now(java.time.ZoneOffset.UTC);
        LocalDate startDate = endDate.minusDays(30);

        List<EmployeeMetric> metricsList = new ArrayList<>();
        int skippedCount = 0;

        for (Employee emp : allEmployees) {
            try {
                EmployeeMetric metric = computeEmployeeMetric(emp, startDate, endDate);
                metricsList.add(metric);
                log.debug("Computed metrics for: {} {} (status: {})", emp.getFirstName(), emp.getLastName(), emp.getStatus());
            } catch (Exception ex) {
                skippedCount++;
                log.error("Failed to compute metrics for employee {} ({} {}): {}", 
                    emp.getEmployeeId(), emp.getFirstName(), emp.getLastName(), ex.getMessage(), ex);
            }
        }

        log.info("Computed metrics for {}/{} employees ({} skipped due to errors)", 
            metricsList.size(), allEmployees.size(), skippedCount);

        if (metricsList.isEmpty()) {
            log.warn("No employee metrics computed for company {}", companyId);
            return List.of();
        }

        log.info("Computed metrics for {} employees, attempting AI rating...", metricsList.size());

        // Try AI rating, fallback to formula if it fails
        List<EmployeePerformanceRatingResponse> results = tryAiRating(metricsList);
        
        log.info("Performance rating complete. Rated {} employees", results.size());
        return results;
    }

    private EmployeeMetric computeEmployeeMetric(Employee emp, LocalDate startDate, LocalDate endDate) {
        List<AttendanceRecord> attendances = attendanceRepository.findByEmployeeAndDateRange(
            emp.getEmployeeId(), startDate, endDate);

        int totalWorkingDays = attendances.size();
        int presentDays = 0;
        int absentDays = 0;
        int lateArrivals = 0;
        int totalLateMinutes = 0;
        int earlyDepartures = 0;
        int totalEarlyDepartureMinutes = 0;
        int overtime = 0;

        for (AttendanceRecord a : attendances) {
            String status = a.getStatus() != null ? a.getStatus().toLowerCase() : "";
            
            if ("absent".equals(status)) {
                absentDays++;
            } else if ("present".equals(status) || "late".equals(status) || "left_work".equals(status) || a.getClockInTime() != null) {
                presentDays++;
            }

            if (a.getDelayMinutes() != null && a.getDelayMinutes() > 0) {
                lateArrivals++;
                totalLateMinutes += a.getDelayMinutes();
            }

            if (a.getEarlyDepartureMinutes() != null && a.getEarlyDepartureMinutes() > 0) {
                earlyDepartures++;
                totalEarlyDepartureMinutes += a.getEarlyDepartureMinutes();
            }

            if (a.getOvertimeMinutes() != null) {
                overtime += a.getOvertimeMinutes();
            }
        }

        // Get leave data
        List<LeaveRequest> approvedLeaves = leaveRequestRepository.findByEmployeeAndStatus(
            emp.getEmployeeId(), "approved");
        
        int sickDays = 0;
        int otherLeaveDays = 0;
        int totalLeaveDays = 0;

        for (LeaveRequest lr : approvedLeaves) {
            if (lr.getStartDate() == null || lr.getEndDate() == null) continue;

            LocalDate actualStart = lr.getStartDate().isBefore(startDate) ? startDate : lr.getStartDate();
            LocalDate actualEnd = lr.getEndDate().isAfter(endDate) ? endDate : lr.getEndDate();
            
            if (!actualStart.isAfter(actualEnd)) {
                int days = (int) java.time.temporal.ChronoUnit.DAYS.between(actualStart, actualEnd) + 1;
                totalLeaveDays += days;

                boolean isSick = lr.getLeaveType() != null 
                    && lr.getLeaveType().getName() != null 
                    && lr.getLeaveType().getName().toLowerCase().contains("sick");
                
                if (isSick) {
                    sickDays += days;
                } else {
                    otherLeaveDays += days;
                }
            }
        }

        double attendanceRate = totalWorkingDays > 0 
            ? Math.round((double) presentDays / totalWorkingDays * 10000.0) / 100.0 
            : 0.0;

        String jobTitle = emp.getJobTitle() != null ? emp.getJobTitle() : "Employee";
        String department = emp.getDepartment() != null ? emp.getDepartment().getName() : "N/A";

        return EmployeeMetric.builder()
            .employeeId(emp.getEmployeeId())
            .firstName(emp.getFirstName())
            .lastName(emp.getLastName())
            .jobTitle(jobTitle)
            .department(department)
            .status(emp.getStatus() != null ? emp.getStatus() : "unknown")
            .totalWorkingDays(totalWorkingDays)
            .presentDays(presentDays)
            .absentDays(absentDays)
            .lateArrivalsCount(lateArrivals)
            .totalLateMinutes(totalLateMinutes)
            .earlyDeparturesCount(earlyDepartures)
            .totalEarlyDepartureMinutes(totalEarlyDepartureMinutes)
            .overtimeMinutes(overtime)
            .sickLeaveDays(sickDays)
            .otherLeaveDays(otherLeaveDays)
            .totalLeaveDays(totalLeaveDays)
            .attendanceRate(attendanceRate)
            .periodLabel("Last 30 Days")
            .build();
    }

    private List<EmployeePerformanceRatingResponse> tryAiRating(List<EmployeeMetric> metricsList) {
        List<AiPerformanceResponseResult> aiResults = null;

        // Try AI rating (non-blocking - fallback always works)
        try {
            AiPerformanceRequest requestPayload = AiPerformanceRequest.builder()
                .metrics(metricsList)
                .build();

            AiPerformanceResponse response = restTemplate.postForObject(
                aiServiceUrl + "/performance/rate", requestPayload, AiPerformanceResponse.class);

            if (response != null && response.getResults() != null && !response.getResults().isEmpty()) {
                aiResults = response.getResults();
                log.info("AI rating successful for {} employees", aiResults.size());
            }
        } catch (RestClientException ex) {
            log.info("AI service unavailable, using formula scoring: {}", ex.getMessage());
        } catch (Exception ex) {
            log.info("AI rating failed, using formula scoring: {}", ex.getMessage());
        }

        // Build final responses (AI if available, otherwise formula)
        List<EmployeePerformanceRatingResponse> responses = new ArrayList<>();
        boolean useAi = aiResults != null && !aiResults.isEmpty();

        for (EmployeeMetric metric : metricsList) {
            double score;
            String reasoning;
            String method;

            if (useAi) {
                AiPerformanceResponseResult aiResult = aiResults.stream()
                    .filter(r -> r.getEmployeeId().equals(metric.employeeId))
                    .findFirst()
                    .orElse(null);

                if (aiResult != null && aiResult.getScore() > 0) {
                    score = Math.round(aiResult.getScore() * 100.0) / 100.0;
                    reasoning = aiResult.getReasoning() != null ? aiResult.getReasoning() : "AI rating based on attendance metrics";
                    method = "ai";
                } else {
                    score = calculateFormulaScore(metric);
                    reasoning = generateFormulaReasoning(metric);
                    method = "formula";
                }
            } else {
                score = calculateFormulaScore(metric);
                reasoning = generateFormulaReasoning(metric);
                method = "formula";
            }

            responses.add(EmployeePerformanceRatingResponse.builder()
                .employeeId(metric.employeeId)
                .firstName(metric.firstName)
                .lastName(metric.lastName)
                .jobTitle(metric.jobTitle)
                .department(metric.department)
                .status(metric.status)
                .totalWorkingDays(metric.totalWorkingDays)
                .presentDays(metric.presentDays)
                .absentDays(metric.absentDays)
                .lateArrivalsCount(metric.lateArrivalsCount)
                .totalLateMinutes(metric.totalLateMinutes)
                .earlyDeparturesCount(metric.earlyDeparturesCount)
                .totalEarlyDepartureMinutes(metric.totalEarlyDepartureMinutes)
                .overtimeMinutes(metric.overtimeMinutes)
                .sickLeaveDays(metric.sickLeaveDays)
                .otherLeaveDays(metric.otherLeaveDays)
                .totalLeaveDays(metric.totalLeaveDays)
                .attendanceRate(metric.attendanceRate)
                .score(score)
                .reasoning(reasoning)
                .ratingMethod(method)
                .build());
        }

        responses.sort(Comparator.comparingDouble(EmployeePerformanceRatingResponse::getScore).reversed());
        return responses;
    }

    private double calculateFormulaScore(EmployeeMetric metric) {
        double score = 100.0;

        // Attendance rate impact
        score -= (100.0 - metric.attendanceRate) * 0.5;

        // Late arrivals penalty
        score -= metric.lateArrivalsCount * 2.0;
        score -= (metric.totalLateMinutes / 60.0) * 1.0;

        // Absence penalty
        score -= metric.absentDays * 8.0;

        // Early departure penalty
        score -= metric.earlyDeparturesCount * 1.5;
        score -= (metric.totalEarlyDepartureMinutes / 60.0) * 0.5;

        // Sick leave minor impact
        score -= metric.sickLeaveDays * 0.5;

        // Overtime bonus
        score += Math.min(5.0, metric.overtimeMinutes / 120.0);

        return Math.max(1.0, Math.min(100.0, Math.round(score * 100.0) / 100.0));
    }

    private String generateFormulaReasoning(EmployeeMetric m) {
        List<String> points = new ArrayList<>();

        if (m.attendanceRate >= 95) {
            points.add(String.format("Excellent attendance rate (%.1f%%)", m.attendanceRate));
        } else if (m.attendanceRate >= 80) {
            points.add(String.format("Good attendance rate (%.1f%%)", m.attendanceRate));
        } else {
            points.add(String.format("Low attendance rate (%.1f%%)", m.attendanceRate));
        }

        if (m.lateArrivalsCount > 0) {
            points.add(String.format("%d late arrival%s (%d min)", 
                m.lateArrivalsCount, m.lateArrivalsCount > 1 ? "s" : "", m.totalLateMinutes));
        }

        if (m.absentDays > 0) {
            points.add(String.format("%d absence day%s", m.absentDays, m.absentDays > 1 ? "s" : ""));
        }

        if (m.earlyDeparturesCount > 0) {
            points.add(String.format("%d early departure%s", 
                m.earlyDeparturesCount, m.earlyDeparturesCount > 1 ? "s" : ""));
        }

        if (m.overtimeMinutes > 60) {
            points.add(String.format("%d min overtime worked", m.overtimeMinutes));
        }

        return String.join(". ", points);
    }
}
