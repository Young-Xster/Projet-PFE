package com.grh.grh.dto.response.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String username;
    private String email;
    private Boolean isActive;
    private Boolean isSuperAdmin;
    private OffsetDateTime lastLogin;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private Set<RoleInfo> roles;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleInfo {
        private UUID roleId;
        private String roleName;
        private UUID companyId;
        private String companyName;
    }
}
