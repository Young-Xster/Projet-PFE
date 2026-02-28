package com.grh.grh.repository;

import com.grh.grh.entity.SubcontractorInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface SubcontractorInvoiceRepository extends JpaRepository<SubcontractorInvoice, UUID> {
    List<SubcontractorInvoice> findByContractId(UUID contractId);
    List<SubcontractorInvoice> findBySubcontractorId(UUID subcontractorId);
    List<SubcontractorInvoice> findByCompanyIdAndStatus(UUID companyId, String status);

    // Overdue invoices (due date passed, still PENDING)
    @Query("SELECT i FROM SubcontractorInvoice i WHERE i.status = 'PENDING' AND i.dueDate < :today")
    List<SubcontractorInvoice> findOverdueInvoices(@Param("today") LocalDate today);

    boolean existsByInvoiceNumberAndCompanyId(String invoiceNumber, UUID companyId);
}