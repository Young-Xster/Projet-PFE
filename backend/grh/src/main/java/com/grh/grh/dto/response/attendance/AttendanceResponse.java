package com.grh.grh.dto.response.attendance;

import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {

    private UUID id;
    private LocalDate date;
    private OffsetDateTime clockInTime;
    private OffsetDateTime clockOutTime;
    private String status;
    private String notes;
    private String source;
    private Integer delayMinutes;
    private Integer workDurationMinutes;

    private UUID companyId;
    private String companyName;

    private UUID employeeId;
    private String employeeName;
    private String employeeDepartment;

    private UUID subcontractorId;
    private String subcontractorName;

    private UUID approvedById;
    private String approvedByName;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
