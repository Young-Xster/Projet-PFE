package com.grh.grh.scheduler;

import com.grh.grh.entity.SubcontractorContract;
import com.grh.grh.repository.SubcontractorContractRepository;
import com.grh.grh.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Runs daily at 8:00 AM to:
 * 1. Notify about contracts expiring within the next 30 days
 * 2. Auto-expire contracts whose endDate has passed
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ContractExpiryScheduler {

    private final SubcontractorContractRepository contractRepository;
    private final NotificationService notificationService;

    private static final int DAYS_BEFORE_EXPIRY = 30;

    @Scheduled(cron = "0 0 8 * * *") // every day at 08:00
    @Transactional
    public void checkContractExpiry() {
        LocalDate today = LocalDate.now();
        LocalDate targetDate = today.plusDays(DAYS_BEFORE_EXPIRY);

        // 1. Notify about contracts expiring soon
        List<SubcontractorContract> expiringSoon = contractRepository.findContractsExpiringBefore(today, targetDate);
        for (SubcontractorContract contract : expiringSoon) {
            long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(today, contract.getEndDate());
            String subName = resolveSubcontractorName(contract);

            notificationService.createNotification(
                contract.getCompany().getId(),
                "CONTRACT_EXPIRY_WARNING",
                "Contract expiring in " + daysLeft + " days",
                "Contract for " + subName + " expires on " + contract.getEndDate() + " (" + daysLeft + " days remaining)",
                "subcontractors",
                contract.getId()
            );
        }

        if (!expiringSoon.isEmpty()) {
            log.info("Sent {} contract expiry warnings", expiringSoon.size());
        }

        // 2. Auto-expire passed contracts
        List<SubcontractorContract> expired = contractRepository.findExpiredContracts(today);
        for (SubcontractorContract contract : expired) {
            contract.setStatus("EXPIRED");
            contractRepository.save(contract);

            String subName = resolveSubcontractorName(contract);
            notificationService.createNotification(
                contract.getCompany().getId(),
                "CONTRACT_EXPIRED",
                "Contract expired",
                "Contract for " + subName + " has expired on " + contract.getEndDate(),
                "subcontractors",
                contract.getId()
            );
        }

        if (!expired.isEmpty()) {
            log.info("Auto-expired {} contracts", expired.size());
        }
    }

    private String resolveSubcontractorName(SubcontractorContract contract) {
        if (contract.getSubcontractor() == null) return "Unknown";
        var sub = contract.getSubcontractor();
        if ("COMPANY".equalsIgnoreCase(sub.getType()) && sub.getCompanyName() != null) {
            return sub.getCompanyName();
        }
        String first = sub.getContactFirstName() != null ? sub.getContactFirstName() : "";
        String last = sub.getContactLastName() != null ? sub.getContactLastName() : "";
        return (first + " " + last).trim();
    }
}
