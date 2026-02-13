package com.grh.grh.dto.request.leave;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveLeaveRequest {
    
    @NotNull(message = "Approved by user ID is required")
    private UUID approvedByUserId;
    
    @NotBlank(message = "Status is required")
    private String status; // approved, rejected
    
    private String comments;
}
