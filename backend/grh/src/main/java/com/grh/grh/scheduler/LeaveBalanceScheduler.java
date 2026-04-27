package com.grh.grh.scheduler;

import com.grh.grh.entity.Company;
import com.grh.grh.entity.Employee;
import com.grh.grh.entity.LeaveBalance;
import com.grh.grh.entity.LeaveType;
import com.grh.grh.repository.CompanyRepository;
import com.grh.grh.repository.EmployeeRepository;
import com.grh.grh.repository.LeaveBalanceRepository;
import com.grh.grh.repository.LeaveTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class LeaveBalanceScheduler {

    private final EmployeeRepository employeeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final CompanyRepository companyRepository;

    /**
     * Runs every year on January 1st at 00:00.
     * Grants new yearly leave balances for all active employees across all companies.
     */
    @Scheduled(cron = "0 0 0 1 1 *")
    @Transactional
    public void grantYearlyLeaveBalances() {
        log.info("Starting yearly leave balance grant process...");
        int currentYear = LocalDate.now().getYear();

        List<Company> companies = companyRepository.findAll();
        for (Company company : companies) {
            List<LeaveType> leaveTypes = leaveTypeRepository.findByCompanyId(company.getId());
            List<Employee> activeEmployees = employeeRepository.findByCompanyIdAndStatus(company.getId(), "active");

            for (Employee employee : activeEmployees) {
                for (LeaveType leaveType : leaveTypes) {
                    if (leaveType.getMaxDaysPerYear() != null && leaveType.getMaxDaysPerYear() > 0) {
                        
                        // Check if a balance already exists for this year
                        boolean balanceExists = leaveBalanceRepository
                                .findByEmployeeEmployeeIdAndLeaveTypeIdAndYear(
                                        employee.getEmployeeId(), leaveType.getId(), currentYear)
                                .isPresent();

                        if (!balanceExists) {
                            LeaveBalance newBalance = LeaveBalance.builder()
                                    .company(company)
                                    .employee(employee)
                                    .leaveType(leaveType)
                                    .year(currentYear)
                                    .totalDays(leaveType.getMaxDaysPerYear())
                                    .usedDays(0)
                                    .remainingDays(leaveType.getMaxDaysPerYear())
                                    .build();
                            leaveBalanceRepository.save(newBalance);
                            log.debug("Granted {} days of {} to {}", leaveType.getMaxDaysPerYear(), leaveType.getName(), employee.getEmail());
                        }
                    }
                }
            }
        }
        log.info("Completed yearly leave balance grant process.");
    }
}
