package com.grh.grh.dto.request.subcontractor;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSubcontractorRequest {
    
    @NotNull(message = "Company ID is required")
    private UUID companyId;
    
    @NotBlank(message = "Subcontractor code is required")
    @Size(max = 50)
    private String subcontractorCode;
    
    @NotBlank(message = "Subcontractor name is required")
    @Size(max = 255)
    private String subcontractorName;
    
    @NotBlank(message = "Contact person is required")
    @Size(max = 255)
    private String contactPerson;
    
    @Email(message = "Invalid email format")
    private String email;
    
    @Size(max = 20)
    private String phone;
    
    private String address;
    
    @NotNull(message = "Contract start date is required")
    private LocalDate contractStartDate;
    
    @NotNull(message = "Contract end date is required")
    private LocalDate contractEndDate;
    
    @NotBlank(message = "Status is required")
    private String status; // active, inactive, suspended
}
