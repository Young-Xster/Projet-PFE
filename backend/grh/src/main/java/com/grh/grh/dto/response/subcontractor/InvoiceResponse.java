package com.grh.grh.dto.response.subcontractor;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {
    private UUID id;
    private UUID contractId;
    private UUID subcontractorId;
    private String subcontractorDisplayName;
    private String invoiceNumber;
    private BigDecimal amount;
    private LocalDate dueDate;
    private LocalDate paidDate;
    private String status;
    private String invoiceDocumentPath;
    private String paymentProofPath;
    private String notes;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}