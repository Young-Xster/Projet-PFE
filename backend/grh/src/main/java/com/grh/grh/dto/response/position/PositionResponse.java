package com.grh.grh.dto.response.position;

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
public class PositionResponse {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private UUID companyId;
    private String companyName;
    private UUID departmentId;
    private String departmentName;
    private OffsetDateTime createdAt;
}
