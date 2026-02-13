package com.grh.grh.dto.request.company;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCompanyRequest {
    @NotBlank(message = "Company name is required")
    @Size(max = 255 , message = "Company name must not exceed 255 characters")
    private String name;

    @NotBlank(message = "Company code is required")
    @Size(max = 255 , message = "Company code must not exceed 255 characters")
    private String code;

    private String accessPassword;

    @Size(max = 100 , message = "Industry Type must not exceed 100 characters")
    private String industryType;

    private String adress;

    @Size(max = 20 , message = "Phone number must not exceed 20 characters" )
    private String phoneNumber;

    @Email(message = "Invalid email format")
    private String email;

}
