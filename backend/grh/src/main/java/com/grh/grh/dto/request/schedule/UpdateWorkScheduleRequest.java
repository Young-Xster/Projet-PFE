package com.grh.grh.dto.request.schedule;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWorkScheduleRequest {
    
    @Size(max = 255)
    private String scheduleName;
    
    private String description;
    
    private Boolean isDefault;
    
    @Valid
    private List<CreateWorkScheduleRequest.ScheduleDetailRequest> scheduleDetails;
}
