package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "roles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"rolePermissions" , "userRoles"})
@ToString(exclude = {"rolePermissions" , "userRoles"})
public class Role extends BaseEntity {
    @Column(nullable = false , unique = true , length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "role" , cascade = CascadeType.ALL , orphanRemoval = true)
    @Builder.Default
    private Set<RolePermission> rolePermissions = new HashSet<>();

    @OneToMany(mappedBy = "role" , cascade = CascadeType.ALL )
    @Builder.Default
    private Set<UserRole> userRoles = new HashSet<>();
}
