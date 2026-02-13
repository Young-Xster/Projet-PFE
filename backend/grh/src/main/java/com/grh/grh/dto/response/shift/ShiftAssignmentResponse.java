package com.grh.grh.dto.response.shift;

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
public class ShiftAssignmentResponse {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private LocalDate shiftDate;
    private LocalTime shiftStartTime;
    private LocalTime shiftEndTime;
    private String status;
    private UUID companyId;
    private String companyName;
    private OffsetDateTime createdAt;
}
