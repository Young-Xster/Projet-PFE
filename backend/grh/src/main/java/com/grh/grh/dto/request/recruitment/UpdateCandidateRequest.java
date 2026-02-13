package com.grh.grh.dto.request.recruitment;

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
public class UpdateCandidateRequest {
    
    @Size(max = 255)
    private String firstName;
    
    @Size(max = 255)
    private String lastName;
    
    @Email
    private String email;
    
    @Size(max = 20)
    private String phone;
    
    private String status;
}
