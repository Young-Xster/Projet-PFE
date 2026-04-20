package com.grh.grh.dto.request.subcontractor;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortalContactUpdateRequest {

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
