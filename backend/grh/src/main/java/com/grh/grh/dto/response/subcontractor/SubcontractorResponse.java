package com.grh.grh.dto.response.subcontractor;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubcontractorResponse {
    private UUID id;
    private UUID companyId;
    private String companyName;          // the company this sub belongs to
    private String type;                 // INDIVIDUAL or COMPANY

    // For COMPANY type
    private String subcontractorCompanyName;

    // Contact person (both types)
    private String contactFirstName;
    private String contactLastName;

    // Resolved display name
    private String displayName;

    // Common
    private String contactEmail;
    private String contactPhone;
    private String address;
    private String city;
    private String specialization;
    private String status;               // ACTIVE, INACTIVE, TERMINATED

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}