package com.grh.grh.dto.response.subcontractor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortalProfileResponse {
    private UUID subcontractorId;
    private UUID companyId;
    private String companyName;
    private String displayName;
    private String type;
    private String contactEmail;
    private String contactPhone;
    private String address;
    private String city;
    private String specialization;
    private String status;
}
