package com.grh.grh.dto.request.employee;

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
public class CreateEmployeeRequest {

    private UUID companyId; // optional: only for super admins
    
    @NotBlank(message = "first name is required")
    @Size(max = 50, message = "first name must be at most 50 characters")
    private String firstName;

    @NotBlank(message = "last name is required")
    @Size(max = 50, message = "last name must be at most 50 characters")
    private String lastName;

    @NotBlank(message = "email is required")
    @Email(message = "invalid email format")
    private String email;

    @NotBlank(message = "phone number is required")
    @Pattern(regexp = "^\\+?[0-9]{7,15}$", message = "invalid phone number format")
    private String phoneNumber;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;
    
    @NotBlank(message = "Gender is required")
    @Pattern(regexp = "^(male|female)$", message = "Gender must be male or female")
    private String gender;
    
    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    private String city;
    
    @NotBlank(message = "Postal code is required")
    private String postalCode;
    
    @NotBlank(message = "Country is required")
    private String country;
    
    @NotBlank(message = "National ID is required")
    private String nationalId;
    
    @NotNull(message = "Hire date is required")
    private LocalDate hireDate;
    
    @NotBlank(message = "Employment type is required")
    private String employmentType;

    @NotBlank(message = "Job title is required")
    private String jobTitle;
    
    private UUID departmentId;
    private UUID managerId;
    private UUID positionId;
    
    @DecimalMin(value = "0.0", inclusive = false, message = "Salary must be greater than 0")
    private BigDecimal salary;
    
    private UUID userId; 
    private String fingerprintId;


}
