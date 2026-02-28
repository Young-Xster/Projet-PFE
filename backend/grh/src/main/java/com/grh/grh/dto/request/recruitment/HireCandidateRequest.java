package com.grh.grh.dto.request.recruitment;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HireCandidateRequest {

    @NotBlank(message = "Job title is required")
    private String jobTitle;

    @NotBlank(message = "Employment type is required")
    private String employmentType;

    @NotNull(message = "Hire date is required")
    private LocalDate hireDate;

    private UUID departmentId;

    private UUID managerId;

    @DecimalMin(value = "0.0", inclusive = false, message = "Salary must be greater than 0")
    private BigDecimal salary;

    // Fields that may differ from candidate data
    private String nationalId;
    private String postalCode;
    private String country;
    private String gender;
}
