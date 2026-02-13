package com.grh.grh.dto.request.leave;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLeaveTypeRequest {
    
    @Size(max = 255)
    private String name;
    
    private String description;
    
    @DecimalMin(value = "0.0")
    private BigDecimal defaultDays;
    
    private Boolean isPaid;
    private Boolean requiresApproval;
    
    @DecimalMin(value = "0.0")
    private BigDecimal maxDaysPerYear;
    
    private Boolean isActive;
}
