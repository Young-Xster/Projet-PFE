package com.grh.grh.dto.request.company;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCompanyRequest {
    
    @Size(max = 255, message = "Company name must not exceed 255 characters")
    private String name;
    
    @Size(max = 100, message = "Industry type must not exceed 100 characters")
    private String industryType;
    
    private String address;
    
    @Size(max = 20, message = "Phone must not exceed 20 characters")
    private String phone;
    
    @Email(message = "Invalid email format")
    private String email;
    
    private String logoPath;
    
    private Boolean isActive;
}
