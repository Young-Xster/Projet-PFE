package com.grh.grh.dto.request.permission;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoleRequest {

    @NotBlank(message = "roleName is required")
    private String roleName;

    private String description;

    @NotEmpty(message = "permissions cannot be empty")
    private List<String> permissions;
}
