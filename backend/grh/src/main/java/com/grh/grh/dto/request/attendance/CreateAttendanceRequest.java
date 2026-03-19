package com.grh.grh.dto.request.attendance;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAttendanceRequest {

    private UUID companyId; // optional: only for super admins

    private UUID employeeId;

    private UUID subcontractorId;

    @NotNull(message = "Date is required")
    private LocalDate date;

    private OffsetDateTime clockInTime;

    private OffsetDateTime clockOutTime;

    private String status; // present, absent, late, half-day, on-leave

    private String notes;

    private UUID approvedById;

    private Integer earlyDepartureMinutes;

    private Integer overtimeMinutes;
}