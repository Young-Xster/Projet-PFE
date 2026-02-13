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
public class LeaveRequestDetailResponse {
    private UUID id;
    private EmployeeInfo employee;
    private LeaveTypeInfo leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalDays;
    private String status;
    private String reason;
    private ApprovalInfo approval;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeInfo {
        private UUID employeeId;
        private String fullName;
        private String email;
        private String department;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaveTypeInfo {
        private UUID id;
        private String name;
        private String code;
        private Boolean isPaid;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApprovalInfo {
        private String approvedByName;
        private OffsetDateTime approvalDate;
        private String comments;
    }
}
