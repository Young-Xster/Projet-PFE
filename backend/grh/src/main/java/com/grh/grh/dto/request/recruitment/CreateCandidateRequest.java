package com.grh.grh.dto.request.recruitment;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCandidateRequest {
    
    @NotNull(message = "Company ID is required")
    private UUID companyId;
    
    @NotNull(message = "Recruitment request ID is required")
    private UUID recruitmentRequestId;
    
    @NotBlank(message = "First name is required")
    @Size(max = 255)
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    @Size(max = 255)
    private String lastName;
    
    @NotBlank(message = "Email is required")
    @Email
    private String email;
    
    @Size(max = 20)
    private String phone;
    
    private String resumePath;
    
    @NotBlank(message = "Status is required")
    private String status; // applied, screening, interview, offered, hired, rejected
}
