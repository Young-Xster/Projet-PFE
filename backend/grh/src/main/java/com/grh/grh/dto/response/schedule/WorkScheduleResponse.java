package com.grh.grh.dto.response.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkScheduleResponse {
    private UUID id;
    private String scheduleName;
    private String description;
    private Boolean isDefault;
    private UUID companyId;
    private String companyName;
    private List<ScheduleDetailResponse> scheduleDetails;
    private OffsetDateTime createdAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleDetailResponse {
        private UUID id;
        private String dayOfWeek;
        private LocalTime startTime;
        private LocalTime endTime;
        private Boolean isWorkingDay;
    }
}
