package com.grh.grh.dto.request.attendance;

import lombok.*;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAttendanceRequest {

    private OffsetDateTime clockInTime;

    private OffsetDateTime clockOutTime;

    private String status;

    private String notes;

    private Integer delayMinutes;

    private Integer earlyDepartureMinutes;

    private Integer overtimeMinutes;
}