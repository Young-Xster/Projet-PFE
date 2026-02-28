package com.grh.grh.dto.response.settings;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanySettingResponse {

    private UUID id;
    private UUID companyId;
    private String companyName;
    private LocalTime workHoursStart;
    private LocalTime workHoursEnd;
    private Integer gracePeriodMinutes;
    private String currency;
    private String dateFormat;
    private String timezone;
}
