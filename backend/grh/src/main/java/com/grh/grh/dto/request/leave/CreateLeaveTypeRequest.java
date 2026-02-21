package com.grh.grh.dto.request.leave;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLeaveTypeRequest {
    
    @NotNull(message = "Company ID is required")
    private UUID companyId;
    
    @NotBlank(message = "Code is required")
    @Size(max = 50)
    private String code;
    
    @NotBlank(message = "Name is required")
    @Size(max = 255)
    private String name;
    
    private String description;
    
    @DecimalMin(value = "0.0", message = "Default days must be positive")
    private BigDecimal defaultDays;
    
    @NotNull(message = "Paid status is required")
    private Boolean isPaid;
    
    @NotNull(message = "Requires approval is required")
    private Boolean requiresApproval;
    
    @DecimalMin(value = "0.0", message = "Max days per year must be positive")
    private BigDecimal maxDaysPerYear;
    
    @Builder.Default
    private Boolean isActive = true;
}
