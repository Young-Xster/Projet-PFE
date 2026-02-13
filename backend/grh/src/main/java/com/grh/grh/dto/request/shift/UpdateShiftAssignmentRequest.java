package com.grh.grh.dto.request.shift;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateShiftAssignmentRequest {
    
    private LocalDate shiftDate;
    private LocalTime shiftStartTime;
    private LocalTime shiftEndTime;
    private String status;
}
