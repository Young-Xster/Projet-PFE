package com.grh.grh.service;

import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.ws.rs.core.Response;
import java.util.*;

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
        this.keycloak = KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm(realm)
                .clientId("GRH")
                .username(adminUsername)
                .password(adminPassword)
                .build();
    }

    private RealmResource getRealm(){
        return keycloak.realm(realm);
    }

    private UsersResource getUsersResource(){
        return getRealm().users();
    }


    public String createUser (String username , String email , String tempPassword , UUID companyId){
        UserRepresentation user = new UserRepresentation();
        user.setUsername(username);
        user.setEmail(email);
        user.setEnabled(true);
        // because the password is sent via email there for email is verified
        user.setEmailVerified(true);
        user.singleAttribute("companyId", companyId.toString());

        // set company as custom attribute
        Map<String , List<String>> attributes = new HashMap<>();
        attributes.put("companyId" , Collections.singletonList(companyId.toString()));
        user.setAttributes(attributes);

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(tempPassword);
        // Forces password change on first login
        credential.setTemporary(true); 
        user.setCredentials(Collections.singletonList(credential));

        user.setRequiredActions(Arrays.asList("UPDATE_PASSWORD"));

        Response response = getUsersResource().create(user);

        if(response.getStatus() != 201){
            throw new RuntimeException("Failed to create user in Keycloak: " + response.getStatusInfo());
        }

        String locationHeader = response.getHeaderString("Location");
        String userId = locationHeader.substring(locationHeader.lastIndexOf('/')+1);

        log.info("created keycloak user:{} with id: {}",username, userId);
        return userId;
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
        log.info("Created Keycloak role: {} with permissions: {}", roleName, flatPermissions);
    }

    public void assignRoleToUser(String keycloakUserId, String roleName) {
        RoleRepresentation role = getRealm().roles().get(roleName).toRepresentation();
        getUsersResource().get(keycloakUserId).roles().realmLevel().add(Collections.singletonList(role));
        log.info("Assigned role {} to user {}", roleName, keycloakUserId);
    }

    public List<RoleRepresentation> getAllRoles() {
        return getRealm().roles().list();
    }

    public void deleteRole(String roleName) {
        getRealm().roles().deleteRole(roleName);
        log.info("Deleted Keycloak role: {}", roleName);
    }

    public void updateUserCompany(String keycloakUserId, UUID companyId) {
        UserRepresentation user = getUsersResource().get(keycloakUserId).toRepresentation();
        Map<String, List<String>> attributes = user.getAttributes() != null ? user.getAttributes() : new HashMap<>();
        attributes.put("companyId", Collections.singletonList(companyId.toString()));
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
}
