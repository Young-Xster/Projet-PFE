package com.grh.grh.dto.request.leave;

import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLeaveRequestRequest {
    
    private LocalDate startDate;
    private LocalDate endDate;
    
    @DecimalMin(value = "0.5")
    private BigDecimal totalDays;
    
    private String reason;
}
