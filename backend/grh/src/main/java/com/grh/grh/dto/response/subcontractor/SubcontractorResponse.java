package com.grh.grh.dto.response.subcontractor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubcontractorResponse {
    private UUID id;
    private String subcontractorCode;
    private String subcontractorName;
    private String contactPerson;
    private String email;
    private String phone;
    private String address;
    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
    private String status;
    private UUID companyId;
    private String companyName;
    private OffsetDateTime createdAt;
}
