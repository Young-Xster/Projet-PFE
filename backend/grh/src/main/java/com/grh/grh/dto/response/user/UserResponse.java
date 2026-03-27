package com.grh.grh.dto.response.user;

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
public class UserResponse {
    private UUID id;
    private String keycloakId;
    private String username;
    private String email;
    private UUID companyId;
    private Boolean isActive;
    private Boolean isSuperAdmin;
    private List<String> roleNames;
    private String message;
}
