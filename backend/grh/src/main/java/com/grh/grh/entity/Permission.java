package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "permissions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"rolePermissions"})
@ToString(exclude = {"rolePermissions"})
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 255)
    private String code;

    @Column(nullable = false, length = 50)
    private String module;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Relationships
    @OneToMany(mappedBy = "permission", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<RolePermission> rolePermissions = new HashSet<>();



}
