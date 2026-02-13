package com.grh.grh.dto.request.attendance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAttendanceRequest {
    
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private String status;
    private String remarks;
}
