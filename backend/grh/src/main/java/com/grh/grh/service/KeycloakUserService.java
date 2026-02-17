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

    @Transactional
    public User syncUserFromKeycloak(Authentication authentication) {
        if (!(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new IllegalStateException("Invalid authentication type");
        }

        String keycloakId = jwt.getSubject();
        String username = jwt.getClaim("preferred_username");
        String email = jwt.getClaim("email");
        
        // Extract companyId from custom attributes
        UUID companyId = extractCompanyId(jwt);
        
        // Check if user has SUPER_ADMIN role
        boolean isSuperAdmin = hasRole(jwt, "SUPER_ADMIN");

        Optional<User> existingUser = userRepository.findByKeycloakId(keycloakId);

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            user.setLastLogin(OffsetDateTime.now());
            user.setCompanyId(companyId);
            user.setIsSuperAdmin(isSuperAdmin);
            return userRepository.save(user);
        } else {
            // Create new user in DB
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
        if (!(authentication.getPrincipal() instanceof Jwt)) {
            throw new IllegalStateException("Invalid authentication type");
        }
        
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = jwt.getSubject();
        return userRepository.findByKeycloakId(keycloakId)
                .map(User::getId)
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }

    public Map<String, List<String>> extractPermissions(Authentication authentication) {
        if (!(authentication.getPrincipal() instanceof Jwt)) {
            throw new IllegalStateException("Invalid authentication type");
        }

        Map<String, List<String>> permissions = new HashMap<>();
        
        // For each role, get its permissions from role attributes
        // (In real implementation, you'd fetch role details from Keycloak or cache)
        // For now, returning empty map - will be populated from role attributes
        
        return permissions;
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