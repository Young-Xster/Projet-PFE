package com.grh.grh.dto.request.employee;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OffboardEmployeeRequest {

    @NotNull(message = "Termination date is required")
    private LocalDate terminationDate;

    @NotBlank(message = "Termination reason is required")
    private String terminationReason;

    private String exitInterviewNotes;
}
