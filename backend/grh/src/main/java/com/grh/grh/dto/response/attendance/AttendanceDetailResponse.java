package com.grh.grh.dto.response.attendance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceDetailResponse {
    private UUID id;
    private EmployeeInfo employee;
    private CompanyInfo company;
    private LocalDate date;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private Duration workDuration;
    private String status;
    private String remarks;
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
    public static class CompanyInfo {
        private UUID id;
        private String name;
        private String code;
    }
}
