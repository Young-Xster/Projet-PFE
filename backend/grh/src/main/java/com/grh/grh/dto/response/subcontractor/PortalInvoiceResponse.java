package com.grh.grh.dto.response.subcontractor;

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
public class PortalInvoiceResponse {
    private UUID id;
    private UUID contractId;
    private String invoiceNumber;
    private BigDecimal amount;
    private LocalDate dueDate;
    private LocalDate paidDate;
    private String status;
    private String notes;
    private String invoiceDocumentDownloadUrl;
    private String paymentProofDownloadUrl;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
