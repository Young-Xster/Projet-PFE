package com.grh.grh.service;

import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.jboss.resteasy.client.jaxrs.ResteasyClient;
import org.jboss.resteasy.client.jaxrs.ResteasyClientBuilder;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.ws.rs.core.Response;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@Slf4j
public class KeycloakAdminService {

    @Value("${keycloak.auth-server-url}")
    private String serverUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.admin.username}")
    private String adminUsername;

    @Value("${keycloak.admin.password}")
    private String adminPassword;

    private Keycloak keycloak;

    @PostConstruct
    public void init() {
        ResteasyClient resteasyClient = (ResteasyClient) ResteasyClientBuilder.newBuilder()
            .connectTimeout(3, TimeUnit.SECONDS)
            .readTimeout(5, TimeUnit.SECONDS)
            .build();

        this.keycloak = KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm("master")  // Admin authentication happens in master realm
                .clientId("admin-cli")  // Use admin-cli client for admin operations
                .username(adminUsername)
                .password(adminPassword)
            .resteasyClient(resteasyClient)
                .build();

        log.info("Initialized Keycloak admin client with connect/read timeouts at {}", serverUrl);
    }

    private RealmResource getRealm(){
        return keycloak.realm(realm);
    }

    private UsersResource getUsersResource(){
        return getRealm().users();
    }

    


    public String createUser (String username , String email  , UUID companyId){

        UserRepresentation user = new UserRepresentation();
        user.setUsername(username);
        user.setEmail(email);
        user.setEnabled(true);
        // because the password is sent via email there for email is verified
        user.setEmailVerified(false);

        if (companyId != null) {
            user.singleAttribute("companyId", companyId.toString());

            // set company as custom attribute
            Map<String, List<String>> attributes = new HashMap<>();
            attributes.put("companyId", Collections.singletonList(companyId.toString()));
            user.setAttributes(attributes);
        }

        user.setRequiredActions(Arrays.asList("UPDATE_PASSWORD", "VERIFY_EMAIL"));

        Response response = getUsersResource().create(user);

        if(response.getStatus() != 201){
            String errorMessage = response.readEntity(String.class);
            log.error("Failed to create Keycloak user: {}", errorMessage);
            throw new RuntimeException("Failed to create Keycloak user: " + errorMessage);
        }

        String locationHeader = response.getHeaderString("Location");
        String userId = locationHeader.substring(locationHeader.lastIndexOf('/')+1);

        try {
            sendPasswordSetupEmail(userId, email);
            log.info("Sent password setup email to {}", email);
        } catch (Exception e) {
            log.error("Failed to send password setup email to {}: {}", email, e.getMessage());
            
        }

        log.info("Created Keycloak user: {} with ID: {}. Password setup email sent.", username, userId);
        return userId;
    }

    private void sendPasswordSetupEmail(String userId, String email) {
        try {
            getUsersResource().get(userId).executeActionsEmail(Arrays.asList("VERIFY_EMAIL", "UPDATE_PASSWORD"));
            log.info("sent password setup email to {}" , email);
        }catch (Exception e){
            log.warn("Could not send password setup email to {}: {}", email, e.getMessage());
        }
    }

    public void resendPasswordSetupEmail(String keycloakUserId) {
        UserRepresentation user = getUsersResource().get(keycloakUserId).toRepresentation();
        
        if (user == null) {
            throw new RuntimeException("User not found: " + keycloakUserId);
        }
        
        sendPasswordSetupEmail(keycloakUserId, user.getEmail());
        log.info("Resent password setup email to {}", user.getEmail());
    }

    public void createRole(String roleName, String description, Map<String, List<String>> permissions) {
        RoleRepresentation role = new RoleRepresentation();
        role.setName(roleName);
        role.setDescription(description);
        
        // Store permissions as role attributes (grouped by module)
         Map<String, List<String>> attributes = new HashMap<>();
        List<String> flatPermissions = new ArrayList<>();
        //format permissions as module:action exp employee:create
        permissions.forEach((module, actions) -> {
            actions.forEach(action -> {
                flatPermissions.add(module + ":" + action);
            });
        });
        
        attributes.put("permissions", flatPermissions);
        role.setAttributes(attributes);

        getRealm().roles().create(role);
        
        // Keycloak API ignores attributes on creation, so we must fetch and update
        RoleRepresentation createdRole = getRealm().roles().get(roleName).toRepresentation();
        createdRole.setAttributes(attributes);
        getRealm().roles().get(roleName).update(createdRole);
        
        log.info("Created Keycloak role: {} with permissions: {}", roleName, flatPermissions);
    }

    public void assignRoleToUser(String keycloakUserId, String roleName) {
        RoleRepresentation role = getRealm().roles().get(roleName).toRepresentation();
        getUsersResource().get(keycloakUserId).roles().realmLevel().add(Collections.singletonList(role));
        log.info("Assigned role {} to user {}", roleName, keycloakUserId);
    }

    public List<String> getUserRoleNames(String keycloakUserId) {
        return getUsersResource().get(keycloakUserId).roles().realmLevel().listAll().stream()
            .map(RoleRepresentation::getName)
            .filter(Objects::nonNull)
            .filter(this::isBusinessRoleName)
            .sorted(String.CASE_INSENSITIVE_ORDER)
            .collect(Collectors.toList());
    }

    public void replaceUserBusinessRoles(String keycloakUserId, String roleName) {
        List<RoleRepresentation> existingBusinessRoles = getUsersResource().get(keycloakUserId)
            .roles()
            .realmLevel()
            .listAll()
            .stream()
            .filter(role -> role.getName() != null && isBusinessRoleName(role.getName()))
            .collect(Collectors.toList());

        if (!existingBusinessRoles.isEmpty()) {
            getUsersResource().get(keycloakUserId).roles().realmLevel().remove(existingBusinessRoles);
            log.info("Removed {} existing business roles from user {}", existingBusinessRoles.size(), keycloakUserId);
        }

        assignRoleToUser(keycloakUserId, roleName);
    }

    public List<RoleRepresentation> getAllRoles() {
        return getRealm().roles().list().stream()
                .map(role -> getRealm().roles().get(role.getName()).toRepresentation())
                .collect(Collectors.toList());
    }

    public void deleteRole(String roleName) {
        getRealm().roles().deleteRole(roleName);
        log.info("Deleted Keycloak role: {}", roleName);
    }

    public void deleteUser(String keycloakUserId) {
        try {
            getUsersResource().get(keycloakUserId).remove();
            log.info("Deleted Keycloak user: {}", keycloakUserId);
        } catch (Exception e) {
            log.warn("Failed to delete Keycloak user {}. Error: {}", keycloakUserId, e.getMessage());
        }
    }

    public void updateUserCompany(String keycloakUserId, UUID companyId) {
        UserRepresentation user = getUsersResource().get(keycloakUserId).toRepresentation();
        Map<String, List<String>> attributes = user.getAttributes() != null ? user.getAttributes() : new HashMap<>();
        
        if (companyId != null) {
            attributes.put("companyId", Collections.singletonList(companyId.toString()));
        } else {
            attributes.remove("companyId");
        }
        
        user.setAttributes(attributes);
        getUsersResource().get(keycloakUserId).update(user);
        log.info("Updated user {} company to {}", keycloakUserId, companyId);
    }

    public RoleRepresentation getRoleWithPermissions(String roleName) {
        return getRealm().roles().get(roleName).toRepresentation();
    }

    public void updateRolePermissions(String roleName, Map<String, List<String>> permissions) {
        RoleRepresentation role = getRealm().roles().get(roleName).toRepresentation();
        
        List<String> flatPermissions = new ArrayList<>();
        permissions.forEach((module, actions) -> {
            actions.forEach(action -> flatPermissions.add(module + ":" + action));
        });
        
        Map<String, List<String>> attributes = role.getAttributes() != null ? role.getAttributes() : new HashMap<>();
        attributes.put("permissions", flatPermissions);
        role.setAttributes(attributes);
        
        getRealm().roles().get(roleName).update(role);
        log.info("Updated role {} permissions: {}", roleName, flatPermissions);
    }

    private boolean isBusinessRoleName(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            return false;
        }
        String lower = roleName.toLowerCase(Locale.ROOT);
        return !lower.startsWith("default-roles-")
            && !"offline_access".equals(lower)
            && !"uma_authorization".equals(lower);
    }
}
