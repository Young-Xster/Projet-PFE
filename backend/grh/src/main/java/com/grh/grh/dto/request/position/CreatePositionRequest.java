package com.grh.grh.dto.request.position;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePositionRequest {
    
    @NotNull(message = "Company ID is required")
    private UUID companyId;
    
    @NotBlank(message = "Position code is required")
    @Size(max = 50)
    private String code;
    
    @NotBlank(message = "Position name is required")
    @Size(max = 255)
    private String name;
    
    private String description;
    
    @NotNull(message = "Department ID is required")
    private UUID departmentId;
}
