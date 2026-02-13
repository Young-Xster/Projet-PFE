package com.grh.grh.dto.request.position;

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
public class UpdatePositionRequest {
    
    @Size(max = 255)
    private String name;
    
    private String description;
    
    private UUID departmentId;
}
