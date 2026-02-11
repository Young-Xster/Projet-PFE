package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "companies")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"departments", "employees", "companySetting", "positions"})
@ToString(exclude = {"departments", "employees", "companySetting", "positions"})
public class Company extends BaseEntity {

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "access_password_hash", length = 255)
    private String accessPasswordHash;

    @Column(name = "industry_type", length = 100)
    private String industryType;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 20)
    private String phone;

    @Column(length = 255)
    private String email;

    @Column(name = "logo_path", length = 255)
    private String logoPath;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    // Relationships
    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Department> departments = new HashSet<>();

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Position> positions = new HashSet<>();

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Employee> employees = new HashSet<>();

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Subcontractor> subcontractors = new HashSet<>();

    @OneToOne(mappedBy = "company", cascade = CascadeType.ALL)
    private CompanySetting companySetting;
}