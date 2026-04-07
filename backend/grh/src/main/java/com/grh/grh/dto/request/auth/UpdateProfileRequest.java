package com.grh.grh.dto.request.auth;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @jakarta.validation.constraints.NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
}
