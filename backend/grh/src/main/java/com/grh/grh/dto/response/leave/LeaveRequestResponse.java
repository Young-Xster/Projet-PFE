package com.grh.grh.dto.response.leave;

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
public class LeaveRequestResponse {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private UUID leaveTypeId;
    private String leaveTypeName;
    private String customLeaveTypeName;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalDays;
    private String status;
    private String reason;
    private OffsetDateTime createdAt;
    private Boolean isEmergencyRequest;
}
