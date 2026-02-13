package com.grh.grh.dto.response.schedule;

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
public class WorkScheduleListResponse {
    private UUID id;
    private String scheduleName;
    private String description;
    private Boolean isDefault;
    private Integer workingDaysCount;
    private OffsetDateTime createdAt;
}
