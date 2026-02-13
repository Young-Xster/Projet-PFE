package com.grh.grh.dto.response.recruitment;

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
public class RecruitmentRequestResponse {
    private UUID id;
    private UUID companyId;
    private String companyName;
    private UUID positionId;
    private String positionName;
    private UUID departmentId;
    private String departmentName;
    private Integer numberOfPositions;
    private String priority;
    private LocalDate requiredByDate;
    private String status;
    private Integer candidatesCount;
    private OffsetDateTime createdAt;
}
