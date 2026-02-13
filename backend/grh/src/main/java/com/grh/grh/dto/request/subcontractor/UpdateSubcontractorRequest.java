package com.grh.grh.dto.request.subcontractor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSubcontractorRequest {
    
    @Size(max = 255)
    private String subcontractorName;
    
    @Size(max = 255)
    private String contactPerson;
    
    @Email
    private String email;
    
    @Size(max = 20)
    private String phone;
    
    private String address;
    
    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
    
    private String status;
}
