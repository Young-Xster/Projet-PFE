package com.grh.grh.dto.request.settings;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCompanySettingRequest {

    private LocalTime workHoursStart;

    private LocalTime workHoursEnd;

    @Min(value = 0, message = "Grace period must be >= 0")
    @Max(value = 120, message = "Grace period must be <= 120 minutes")
    private Integer gracePeriodMinutes;

    @Size(max = 10, message = "Currency code too long")
    private String currency;

    @Size(max = 20, message = "Date format too long")
    private String dateFormat;

    @Size(max = 50, message = "Timezone too long")
    private String timezone;
}
