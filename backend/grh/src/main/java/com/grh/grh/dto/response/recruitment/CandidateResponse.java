package com.grh.grh.dto.response.recruitment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateResponse {
    private UUID id;
    private String fullName;
    private String email;
    private String phone;
    private String status;
    private String resumePath;
    private UUID recruitmentRequestId;
    private String positionName;
    private UUID companyId;
    private String companyName;
    private OffsetDateTime appliedAt;
}
