package com.grh.grh.dto.response.attendance;

import lombok.*;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OvertimeSummaryResponse {

    private UUID employeeId;
    private String employeeName;
    private String employeeDepartment;
    private int month;
    private int year;
    private long totalOvertimeMinutes;
    private double totalOvertimeHours;
}
