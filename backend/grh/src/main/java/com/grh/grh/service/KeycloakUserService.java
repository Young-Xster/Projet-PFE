// filepath: backend/grh/src/main/java/com/grh/grh/service/KeycloakUserService.java
package com.grh.grh.service;

import com.grh.grh.entity.User;
import com.grh.grh.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakUserService {

    private final UserRepository userRepository;
    private final KeycloakAdminService keycloakAdminService;

    @Transactional
    public User syncUserFromKeycloak(Authentication authentication) {
        if (!(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new IllegalStateException("Invalid authentication type");
        }

        String keycloakId = jwt.getSubject();
        String username = jwt.getClaim("preferred_username");
        String email = jwt.getClaim("email");
        
        UUID companyId = extractCompanyId(jwt);
        boolean isSuperAdmin = hasRole(jwt, "SUPER_ADMIN");

        Optional<User> existingUser = userRepository.findByKeycloakId(keycloakId);

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            user.setLastLogin(OffsetDateTime.now());
            user.setCompanyId(companyId);
            user.setIsSuperAdmin(isSuperAdmin);
            return userRepository.save(user);
        } else {
            User newUser = User.builder()
                .keycloakId(keycloakId)
                .username(username)
                .email(email)
                .companyId(companyId)
                .isActive(true)
                .isSuperAdmin(isSuperAdmin)
                .lastLogin(OffsetDateTime.now())
                .build();
            
            return userRepository.save(newUser);
        }
    }

    public UUID getCurrentUserId(Authentication authentication) {
        if (!(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new IllegalStateException("Invalid authentication type");
        }
        
        String keycloakId = jwt.getSubject();
        return userRepository.findByKeycloakId(keycloakId)
                .map(User::getId)
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }

    /**
     * Extract permissions from JWT by fetching role details from Keycloak
     * This is called AFTER authentication to get full permission list
     */
    public List<String> extractPermissions(Authentication authentication) {
        if (!(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new IllegalStateException("Invalid authentication type");
        }

        List<String> allPermissions = new ArrayList<>();
        Collection<String> roles = extractRoles(jwt);

        // For each role, fetch its permissions from Keycloak
        for (String roleName : roles) {
            try {
                var roleRepresentation = keycloakAdminService.getRoleWithPermissions(roleName);
                Map<String, List<String>> attributes = roleRepresentation.getAttributes();
                
                if (attributes != null && attributes.containsKey("permissions")) {
                    allPermissions.addAll(attributes.get("permissions"));
                }
            } catch (Exception e) {
                log.warn("Failed to fetch permissions for role: {}", roleName, e);
            }
        }

        return allPermissions;
    }

    public UUID getCurrentUserCompanyId(Authentication authentication) {
        if (!(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new IllegalStateException("Invalid authentication type");
        }
        
        String keycloakId = jwt.getSubject();
        return userRepository.findByKeycloakId(keycloakId)
                .map(User::getCompanyId)
                .orElse(null);
    }

    public boolean isSuperAdmin(Authentication authentication) {
        if (!(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new IllegalStateException("Invalid authentication type");
        }
        
        return hasRole(jwt, "SUPER_ADMIN");
    }

    /**
     * Check if user has a specific permission (e.g., "employees:create")
     */
    public boolean hasPermission(Authentication authentication, String permission) {
        List<String> permissions = extractPermissions(authentication);
        return permissions.contains(permission);
    }

    private UUID extractCompanyId(Jwt jwt) {
        Map<String, Object> attributes = jwt.getClaim("attributes");
        if (attributes != null && attributes.containsKey("companyId")) {
            Object companyIdObj = attributes.get("companyId");
            if (companyIdObj instanceof List) {
                String companyIdStr = ((List<?>) companyIdObj).get(0).toString();
                return UUID.fromString(companyIdStr);
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private Collection<String> extractRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            return (Collection<String>) realmAccess.get("roles");
        }
        return Collections.emptyList();
    }

    private boolean hasRole(Jwt jwt, String role) {
        return extractRoles(jwt).contains(role);
    }
}