package com.grh.grh.dto.response.subcontractor;

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
public class PortalSessionResponse {
    private String sessionToken;
    private OffsetDateTime expiresAt;
    private UUID subcontractorId;
    private String subcontractorDisplayName;
}
