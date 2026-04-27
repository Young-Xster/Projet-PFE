package com.grh.grh.dto.request.leave;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicLeaveRequest {
    @NotBlank(message = "National ID is required")
    private String nationalId;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotNull(message = "Company ID is required")
    private UUID companyId;

    @NotNull(message = "Leave type ID is required")
    private UUID leaveTypeId;

    private String customLeaveTypeName;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Total days is required")
    @DecimalMin(value = "0.5", message = "Total days must be at least 0.5")
    private BigDecimal totalDays;

    private String reason;

    @Builder.Default
    private Boolean isEmergencyRequest = false;
}
