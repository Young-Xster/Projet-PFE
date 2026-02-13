package com.grh.grh.dto.request.role;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoleRequest {
    
    @NotNull(message = "Company ID is required")
    private UUID companyId;
    
    @NotBlank(message = "Role name is required")
    @Size(max = 255, message = "Role name must not exceed 255 characters")
    private String name;
    
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;
    
    @NotEmpty(message = "At least one permission is required")
    @Valid
    private List<PermissionToggle> permissions;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionToggle {
        @NotBlank(message = "Permission code is required")
        private String permissionCode; 
        
        @NotNull(message = "Enabled flag is required")
        private Boolean enabled;
    }
}