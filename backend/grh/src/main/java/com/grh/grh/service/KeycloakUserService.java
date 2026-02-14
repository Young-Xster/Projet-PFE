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
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakUserService {

    private final UserRepository userRepository;

    @Transactional
    public User syncUserFromKeycloak(Authentication authentication) {
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String keycloakUserId = jwt.getSubject();
            String username = jwt.getClaim("preferred_username");
            String email = jwt.getClaim("email");
            
            Optional<User> existingUser = userRepository.findByUsername(username);
            
            if (existingUser.isPresent()) {
                User user = existingUser.get();
                user.setLastLogin(OffsetDateTime.now());
                return userRepository.save(user);
            } else {
                // Create new user in database
                User newUser = User.builder()
                    .username(username)
                    .email(email)
                    .passwordHash("") // No password needed, handled by Keycloak
                    .isActive(true)
                    .isSuperAdmin(hasRole(jwt, "SUPER_ADMIN"))
                    .lastLogin(OffsetDateTime.now())
                    .build();
                
                return userRepository.save(newUser);
            }
        }
        throw new IllegalStateException("Invalid authentication type");
    }

    public UUID getCurrentUserId(Authentication authentication) {
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String username = jwt.getClaim("preferred_username");
            return userRepository.findByUsername(username)
                .map(User::getId)
                .orElseThrow(() -> new IllegalStateException("User not found"));
        }
        throw new IllegalStateException("Invalid authentication type");
    }

    private boolean hasRole(Jwt jwt, String role) {
        // Check realm roles
        Object realmAccess = jwt.getClaim("realm_access");
        if (realmAccess instanceof java.util.Map) {
            java.util.Map<String, Object> realmMap = (java.util.Map<String, Object>) realmAccess;
            if (realmMap.containsKey("roles")) {
                java.util.Collection<String> roles = (java.util.Collection<String>) realmMap.get("roles");
                return roles.contains(role);
            }
        }
        return false;
    }
}