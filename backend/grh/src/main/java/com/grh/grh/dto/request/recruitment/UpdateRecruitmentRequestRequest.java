package com.grh.grh.dto.request.recruitment;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRecruitmentRequestRequest {
    
    @Min(value = 1)
    private Integer numberOfPositions;
    
    private String priority;
    
    private LocalDate requiredByDate;
    
    private String status;
    
    private String jobDescription;
    
    private String requirements;
}
