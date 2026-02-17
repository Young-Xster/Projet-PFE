package com.grh.grh.dto.response.auth;

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
public class UserContextResponse {
    private UUID id;
    private String username;
    private String email;
    private Boolean isActive;
    private Boolean isSuperAdmin;
    private OffsetDateTime lastLogin;
    private CompanyContext companyContext;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompanyContext {
        private UUID companyId;
        private String companyName;
        private String companyCode;
        private List<String> permissions;
    }
}