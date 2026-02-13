package com.grh.grh.dto.response.attendance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private LocalDate date;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private String status;
    private String remarks;
    private OffsetDateTime createdAt;
}
