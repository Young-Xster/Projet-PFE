package com.grh.grh.dto.response.department;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentResponse {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private UUID companyId;
    private String companyName;
    private UUID parentDepartmentId;
    private String parentDepartmentName;
    private UUID managerId;
    private String managerName;
    private Integer employeeCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
