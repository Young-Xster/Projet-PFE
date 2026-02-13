package com.grh.grh.dto.response.auth;

import com.grh.grh.enums.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String accessToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long expiresIn;
    private UserInfo user;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private UUID id;
        private String username;
        private String email;
        private Boolean isActive;
        private Boolean isSuperAdmin;
        private OffsetDateTime lastLogin;
        
        // Company context after login
        private CompanyContext companyContext;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompanyContext {
        private UUID companyId;
        private String companyName;
        private String companyCode;
        private Boolean isCreator;          
        private RoleInfo role;              
        private List<String> permissions;   
        private AccessLevel accessLevel;  
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleInfo {
        private UUID roleId;
        private String roleName;
        private String roleDescription;
    }
}