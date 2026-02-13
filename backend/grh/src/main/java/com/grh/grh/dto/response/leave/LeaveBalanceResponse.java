package com.grh.grh.dto.response.leave;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveBalanceResponse {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private UUID leaveTypeId;
    private String leaveTypeName;
    private Integer year;
    private BigDecimal totalDays;
    private BigDecimal usedDays;
    private BigDecimal remainingDays;
    private BigDecimal carriedOverDays;
}
