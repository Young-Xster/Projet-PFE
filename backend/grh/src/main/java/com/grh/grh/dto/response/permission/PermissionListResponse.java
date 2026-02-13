package com.grh.grh.dto.response.permission;

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
public class PermissionListResponse {
    private List<ModulePermissions> modules;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModulePermissions {
        private String moduleName;
        private String displayName;
        private List<PermissionOption> actions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionOption {
        private UUID id;
        private String name;
        private String action;
        private String displayName;
        private String description;
        private boolean enabled;
    }
    
}
