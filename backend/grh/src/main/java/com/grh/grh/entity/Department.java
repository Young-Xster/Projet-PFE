package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;


@Entity
@Table(name = "departments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"company", "manager", "parentDepartment", "subdepartments", "employees", "positions"})
@ToString(exclude = {"company", "manager", "parentDepartment", "subdepartments", "employees", "positions"})
public class Department extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id" , nullable = false)
    private Company company;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false , unique = true , length = 255)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_department_id")
    private Department parentDepartment;

    @OneToMany(mappedBy = "parentDepartment", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Department> subdepartments = new HashSet<>();

    @OneToMany(mappedBy = "department" , cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Employee> employees = new HashSet<>();

    @OneToMany(mappedBy = "department" , cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Position> positions = new HashSet<>();

}
