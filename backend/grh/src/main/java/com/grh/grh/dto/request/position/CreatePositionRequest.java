package com.grh.grh.dto.request.position;

import jakarta.validation.constraints.NotBlank;
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

    private UUID companyId; // optional: only for super admins

    @NotBlank(message = "Title is required")
    @Size(max = 255)
    private String title;

    @NotBlank(message = "Code is required")
    @Size(max = 255)
    private String code;

    private UUID departmentId;

    private String description;

    private String requiredSkills;

    private Integer experienceYearsRequired;
}