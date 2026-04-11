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
public class PortalContractResponse {
    private UUID id;
    private LocalDate startDate;
    private LocalDate endDate;
    private String paymentType;
    private BigDecimal amount;
    private String status;
    private String notes;
    private String documentDownloadUrl;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
