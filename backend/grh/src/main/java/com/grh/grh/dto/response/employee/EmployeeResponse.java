package com.grh.grh.dto.response.employee;

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
public class EmployeeResponse {
    private UUID employeeId;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String jobTitle;
    private String employmentType;
    private String status;
    private LocalDate hireDate;
    private LocalDate terminationDate;
    private String terminationReason;
    private String exitInterviewNotes;
    private BigDecimal salary;
    private String photoPath;

    private CompanyInfo company;
    private DepartmentInfo department;
    private ManagerInfo manager;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompanyInfo {
        private UUID id;
        private String name;
        private String code;
    }
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepartmentInfo {
        private UUID id;
        private String name;
        private String code;
    }
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManagerInfo {
        private UUID id;
        private String fullName;
        private String email;
    }
    
}
