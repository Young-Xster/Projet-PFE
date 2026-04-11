package com.grh.grh.dto.request.subcontractor;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortalRequestAccessRequest {

    @JsonAlias("email")
    @NotBlank(message = "email is required")
    @Email(message = "Invalid email format")
    private String contactEmail;

    private String turnstileToken;
}
