package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "leave_types")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"company", "leaveRequests", "leaveBalances"})
@ToString(exclude = {"company", "leaveRequests", "leaveBalances"})
public class LeaveType extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id" , nullable = false)
    private Company company;

    @Column(nullable = false , length = 255)
    private String name;

    @Column(nullable = false , length = 255)
    private String code;

    @Column(name = "is_paid" , nullable = false)
    @Builder.Default
    private Boolean isPaid = false;

    @Column(name = "max_days_per_year")
    private Integer maxDaysPerYear;

    @Column(name = "requires_approval", nullable = false)
    @Builder.Default
    private Boolean requiresApproval = true;

    @Column(name = "color_hex", length = 10)
    @Builder.Default
    private String colorHex = "#000000";

    @Column(columnDefinition = "TEXT")
    private String description;

    
    @OneToMany(mappedBy = "leaveType", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<LeaveRequest> leaveRequests = new HashSet<>();

    @OneToMany(mappedBy = "leaveType", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<LeaveBalance> leaveBalances = new HashSet<>();
}
