package com.grh.grh.service;

import com.grh.grh.entity.*;
import com.grh.grh.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubcontractorScheduler {

    private final SubcontractorContractRepository contractRepository;
    private final SubcontractorInvoiceRepository invoiceRepository;
    private final SubcontractorReviewRepository reviewRepository;
    private final SubcontractorRepository subcontractorRepository;
    private final NotificationService notificationService;
    

    // daily midnight check if contract is expring in 7 days
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void checkExpiringContracts() {
        LocalDate today = LocalDate.now();
        LocalDate in7Days = today.plusDays(7);

        List<SubcontractorContract> expiring = contractRepository
            .findContractsExpiringBefore(today, in7Days);

        for (SubcontractorContract contract : expiring) {
            Subcontractor sub = contract.getSubcontractor();
            String displayName = resolveDisplayName(sub);

            notificationService.createNotification(
                sub.getCompany().getId(),
                "CONTRACT_EXPIRY",
                "Contract Expiring Soon",
                "The contract with " + displayName + " expires on " + contract.getEndDate()
                    + ". Please renew or terminate.",
                "SUBCONTRACTOR",
                sub.getId()
            );
        }
        if (!expiring.isEmpty()) {
            log.info("Sent {} contract expiry notifications", expiring.size());
        }
    }

    // auto expire passed contracts daily
    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void autoExpireContracts() {
        List<SubcontractorContract> expired = contractRepository
            .findExpiredContracts(LocalDate.now());

        for (SubcontractorContract contract : expired) {
            contract.setStatus("EXPIRED");
            contractRepository.save(contract);
        }

        if (!expired.isEmpty()) {
            log.info("Auto-expired {} contracts", expired.size());
        }
    }

    // mark overdue invoices daily
    @Scheduled(cron = "0 10 0 * * *")
    @Transactional
    public void checkOverdueInvoices() {
        List<SubcontractorInvoice> overdue = invoiceRepository
            .findOverdueInvoices(LocalDate.now());

        for (SubcontractorInvoice invoice : overdue) {
            invoice.setStatus("OVERDUE");
            invoiceRepository.save(invoice);

            Subcontractor sub = invoice.getSubcontractor();
            notificationService.createNotification(
                sub.getCompany().getId(),
                "INVOICE_OVERDUE",
                "Invoice Overdue",
                "Invoice #" + invoice.getInvoiceNumber() + " from "
                    + resolveDisplayName(sub) + " is overdue since " + invoice.getDueDate() + ".",
                "SUBCONTRACTOR",
                invoice.getId()
            );
        }
        if (!overdue.isEmpty()) {
            log.info("Marked {} invoices as overdue", overdue.size());
        }
    }

    //1st of every month: auto-create draft reviews
    @Scheduled(cron = "0 0 1 1 * *") // 01:00 AM on 1st of every month
    @Transactional
    public void autoCreateMonthlyReviews() {
        LocalDate now = LocalDate.now();
        int month = now.getMonthValue();
        int year = now.getYear();

        List<Subcontractor> activeSubcontractors =
            subcontractorRepository.findAll().stream()
                .filter(s -> "ACTIVE".equals(s.getStatus()))
                .toList();

        int created = 0;
        for (Subcontractor sub : activeSubcontractors) {
            // Check if review for this month already exists
            boolean exists = reviewRepository
                .findBySubcontractorIdAndReviewMonthAndReviewYear(sub.getId(), month, year)
                .isPresent();

            if (!exists) {
                SubcontractorReview review = SubcontractorReview.builder()
                    .subcontractor(sub)
                    .company(sub.getCompany())
                    .reviewMonth(month)
                    .reviewYear(year)
                    .status("DRAFT")
                    .build();

                reviewRepository.save(review);

                // Notify HR
                notificationService.createNotification(
                    sub.getCompany().getId(),
                    "REVIEW_DUE",
                    "Monthly Review Due",
                    "Monthly performance review for " + resolveDisplayName(sub)
                        + " is ready to be filled in.",
                    "SUBCONTRACTOR",
                    sub.getId()
                );
                created++;
            }
        }
        if (created > 0) {
            log.info("Auto-created {} monthly subcontractor reviews for {}/{}", created, month, year);
        }
    }

    private String resolveDisplayName(Subcontractor s) {
        if ("INDIVIDUAL".equalsIgnoreCase(s.getType())) {
            return s.getFirstName() + " " + s.getLastName();
        }
        return s.getCompanyName();
    }
}
