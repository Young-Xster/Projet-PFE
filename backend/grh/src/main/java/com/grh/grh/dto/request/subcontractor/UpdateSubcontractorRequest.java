package com.grh.grh.dto.request.subcontractor;

import jakarta.validation.constraints.Email;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSubcontractorRequest {

    private String firstName;
    private String lastName;
    private String companyName;
    private String contactFirstName;
    private String contactLastName;

    @Email(message = "Invalid email format")
    private String contactEmail;

    private String contactPhone;
    private String address;
    private String city;
    private String specialization;
    private String status; // ACTIVE or INACTIVE
}