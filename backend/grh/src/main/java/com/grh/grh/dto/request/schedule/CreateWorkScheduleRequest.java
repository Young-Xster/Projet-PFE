package com.grh.grh.dto.request.schedule;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWorkScheduleRequest {
    
    @NotNull(message = "Company ID is required")
    private UUID companyId;
    
    @NotBlank(message = "Schedule name is required")
    @Size(max = 255)
    private String scheduleName;
    
    private String description;
    
    @Builder.Default
    private Boolean isDefault = false;
    
    @NotEmpty(message = "At least one schedule detail is required")
    @Valid
    private List<ScheduleDetailRequest> scheduleDetails;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleDetailRequest {
        @NotBlank(message = "Day of week is required")
        private String dayOfWeek; // monday, tuesday, etc.
        
        @NotNull(message = "Start time is required")
        private LocalTime startTime;
        
        @NotNull(message = "End time is required")
        private LocalTime endTime;
        
        @NotNull(message = "Is working day flag is required")
        private Boolean isWorkingDay;
    }
}
