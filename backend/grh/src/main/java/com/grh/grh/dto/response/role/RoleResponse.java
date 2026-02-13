package com.grh.grh.dto.response.role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleResponse {
    private UUID id;
    private String name;
    private String description;
    private UUID companyId;
    private String companyName;
    private List<PermissionInfo> permissions;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionInfo {
        private UUID id;
        private String code;
        private String module;
        private String action;
        private String description;

    }
}
