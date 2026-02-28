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
public class ContractResponse {
    private UUID id;
    private UUID subcontractorId;
    private String subcontractorDisplayName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String paymentType;
    private BigDecimal amount;
    private String status;
    private String contractDocumentPath;
    private String notes;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}