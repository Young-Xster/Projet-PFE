package com.grh.grh.dto.request.attendance;

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
public class CreateAttendanceRequest {
    
    @NotNull(message = "Employee ID is required")
    private UUID employeeId;
    
    @NotNull(message = "Company ID is required")
    private UUID companyId;
    
    @NotNull(message = "Date is required")
    private LocalDate date;
    
    @NotNull(message = "Check-in time is required")
    private LocalTime checkInTime;
    
    private LocalTime checkOutTime;
    
    private String status; // present, absent, late, half_day
    
    private String remarks;
}
