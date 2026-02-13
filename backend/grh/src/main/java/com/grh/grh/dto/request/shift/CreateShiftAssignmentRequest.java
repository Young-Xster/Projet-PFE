package com.grh.grh.dto.request.shift;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateShiftAssignmentRequest {
    
    @NotNull(message = "Employee ID is required")
    private UUID employeeId;
    
    @NotNull(message = "Company ID is required")
    private UUID companyId;
    
    @NotNull(message = "Schedule ID is required")
    private UUID scheduleId;
    
    @NotNull(message = "Shift date is required")
    private LocalDate shiftDate;
    
    @NotNull(message = "Start time is required")
    private LocalTime shiftStartTime;
    
    @NotNull(message = "End time is required")
    private LocalTime shiftEndTime;
    
    @NotNull(message = "Status is required")
    private String status; // scheduled, completed, cancelled
}
