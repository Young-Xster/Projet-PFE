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
public class UpdateEmployeeRequest {
    
    @Size(max = 50, message = "First name must be at most 50 characters")
    private String firstName;
    
    @Size(max = 50, message = "Last name must be at most 50 characters")
    private String lastName;
    
    @Email(message = "Invalid email format")
    private String email;
    
    @Pattern(regexp = "^\\+?[0-9]{7,15}$", message = "Invalid phone number format")
    private String phoneNumber;
    
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;
    
    @Pattern(regexp = "^(male|female)$", message = "Gender must be male or female")
    private String gender;
    
    private String address;
    private String city;
    private String postalCode;
    private String country;
    
    private String nationalId;
    
    private LocalDate hireDate;
    private LocalDate terminationDate;
    
    private String employmentType; 
    private String jobTitle;
    
    private UUID departmentId;
    private UUID managerId;
    
    @DecimalMin(value = "0.0", inclusive = false, message = "Salary must be greater than 0")
    private BigDecimal salary;
    
    private String status; 
    
    private String fingerprintId;
    private String photoPath;
}