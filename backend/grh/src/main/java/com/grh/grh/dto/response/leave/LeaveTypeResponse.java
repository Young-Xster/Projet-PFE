package com.grh.grh.dto.response.leave;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveTypeResponse {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private BigDecimal defaultDays;
    private Boolean isPaid;
    private Boolean requiresApproval;
    private BigDecimal maxDaysPerYear;
    private Boolean isActive;
    private UUID companyId;
    private String companyName;
    private OffsetDateTime createdAt;
}
