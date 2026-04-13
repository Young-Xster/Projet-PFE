package com.grh.grh.scheduler;

import com.grh.grh.entity.Company;
import com.grh.grh.entity.Employee;
import com.grh.grh.entity.ScheduleDetail;
import com.grh.grh.entity.ShiftAssignment;
import com.grh.grh.repository.CompanyRepository;
import com.grh.grh.repository.EmployeeRepository;
import com.grh.grh.repository.EmployeeScheduleRepository;
import com.grh.grh.repository.ShiftAssignmentRepository;
import com.grh.grh.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class AISchedulingAlertScheduler {

    private final CompanyRepository companyRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeScheduleRepository employeeScheduleRepository;
    private final ShiftAssignmentRepository shiftAssignmentRepository;
    private final NotificationService notificationService;

    @Value("${ai.scheduling.alert.overschedule-threshold-hours:8}")
    private double overscheduleThresholdHours;

    @Value("${ai.scheduling.alert.underschedule-threshold-hours:8}")
    private double underscheduleThresholdHours;

    @Scheduled(cron = "0 0 7 * * MON")
    @Transactional(readOnly = true)
    public void detectSchedulingAnomalies() {
        List<Company> activeCompanies = companyRepository.findAllActive(true);
        if (activeCompanies.isEmpty()) {
            return;
        }

        LocalDate weekStart = LocalDate.now().with(DayOfWeek.MONDAY);
        LocalDate weekEnd = weekStart.plusDays(6);

        for (Company company : activeCompanies) {
            analyzeCompanyWeek(company.getId(), weekStart, weekEnd);
        }
    }

    private void analyzeCompanyWeek(UUID companyId, LocalDate weekStart, LocalDate weekEnd) {
        List<Employee> employees = employeeRepository.findByCompanyIdAndStatus(companyId, "active");
        if (employees.isEmpty()) {
            return;
        }

        List<ShiftAssignment> shifts = shiftAssignmentRepository
            .findByCompanyIdAndShiftDateBetween(companyId, weekStart, weekEnd);

        Map<UUID, Double> actualHoursByEmployee = new HashMap<>();
        for (ShiftAssignment shift : shifts) {
            if (shift.getEmployee() == null) {
                continue;
            }
            if (shift.getStatus() != null) {
                String status = shift.getStatus().toLowerCase();
                if ("cancelled".equals(status) || "canceled".equals(status)) {
                    continue;
                }
            }

            Duration duration = Duration.between(shift.getShiftStartTime(), shift.getShiftEndTime());
            double hours = Math.max(0, duration.toMinutes() / 60.0);
            UUID employeeId = shift.getEmployee().getEmployeeId();
            actualHoursByEmployee.merge(employeeId, hours, Double::sum);
        }

        int alerts = 0;
        for (Employee employee : employees) {
            double expectedHours = computeExpectedWeeklyHours(employee.getEmployeeId(), weekStart, weekEnd);
            if (expectedHours <= 0) {
                continue;
            }

            double actualHours = actualHoursByEmployee.getOrDefault(employee.getEmployeeId(), 0.0);
            double diff = actualHours - expectedHours;

            if (diff >= overscheduleThresholdHours) {
                notificationService.createNotification(
                    companyId,
                    "AI_ALERT",
                    "AI alert: employee overscheduled",
                    "AI detected possible overscheduling for " + employee.getFirstName() + " " + employee.getLastName()
                        + " (expected " + formatHours(expectedHours) + "h, assigned " + formatHours(actualHours) + "h this week).",
                    "SCHEDULING",
                    null,
                    "HIGH"
                );
                alerts++;
            } else if ((-diff) >= underscheduleThresholdHours) {
                notificationService.createNotification(
                    companyId,
                    "AI_ALERT",
                    "AI alert: employee underscheduled",
                    "AI detected possible underscheduling for " + employee.getFirstName() + " " + employee.getLastName()
                        + " (expected " + formatHours(expectedHours) + "h, assigned " + formatHours(actualHours) + "h this week).",
                    "SCHEDULING",
                    null,
                    "MEDIUM"
                );
                alerts++;
            }
        }

        if (alerts > 0) {
            log.info("Generated {} AI scheduling alerts for company {} ({} -> {})", alerts, companyId, weekStart, weekEnd);
        }
    }

    private double computeExpectedWeeklyHours(UUID employeeId, LocalDate weekStart, LocalDate weekEnd) {
        double total = 0;
        for (LocalDate date = weekStart; !date.isAfter(weekEnd); date = date.plusDays(1)) {
            var assignmentOpt = employeeScheduleRepository.findActiveScheduleForEmployee(employeeId, date);
            if (assignmentOpt.isEmpty()) {
                continue;
            }

            String dayName = date.getDayOfWeek().name().toLowerCase();
            ScheduleDetail detail = assignmentOpt.get().getSchedule().getScheduleDetails().stream()
                .filter(d -> dayName.equalsIgnoreCase(d.getDayOfWeek()))
                .findFirst()
                .orElse(null);

            if (detail == null || !Boolean.TRUE.equals(detail.getIsWorkingDay())
                || detail.getWorkStartTime() == null || detail.getWorkEndTime() == null) {
                continue;
            }

            Duration duration = Duration.between(detail.getWorkStartTime(), detail.getWorkEndTime());
            total += Math.max(0, duration.toMinutes() / 60.0);
        }
        return total;
    }

    private String formatHours(double value) {
        return String.format(java.util.Locale.ROOT, "%.1f", value);
    }
}
