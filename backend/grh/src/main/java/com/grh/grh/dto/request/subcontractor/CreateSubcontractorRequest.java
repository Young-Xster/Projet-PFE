package com.grh.grh.dto.request.subcontractor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSubcontractorRequest {

    private UUID companyId; //auto-resolved from token

    @NotNull(message = "Type is required")
    private String type; // INDIVIDUAL or COMPANY

    // Individual
    private String firstName;
    private String lastName;

    // Company
    private String companyName;
    private String contactFirstName;
    private String contactLastName;

    @Email(message = "Invalid email format")
    private String contactEmail;

    private String contactPhone;
    private String address;
    private String city;
    private String specialization;
}