package com.grh.grh.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PermissionModule {
    // Core Management
    USERS("users", "User Management"),
    COMPANIES("companies", "Company Management"),
    ROLES("roles", "Role Management"),
    PERMISSIONS("permissions", "Permission Management"),
    
    // Organization
    DEPARTMENTS("departments", "Department Management"),
    POSITIONS("positions", "Position Management"),
    EMPLOYEES("employees", "Employee Management"),
    SUBCONTRACTORS("subcontractors", "Subcontractor Management"),
    
    // Time & Attendance
    ATTENDANCE("attendance", "Attendance Management"),
    WORK_SCHEDULES("work_schedules", "Work Schedule Management"),
    SHIFT_ASSIGNMENTS("shift_assignments", "Shift Assignment Management"),
    
    // Leave Management
    LEAVE_TYPES("leave_types", "Leave Type Management"),
    LEAVE_REQUESTS("leave_requests", "Leave Request Management"),
    LEAVE_BALANCES("leave_balances", "Leave Balance Management"),
    
    // Recruitment
    RECRUITMENT_REQUESTS("recruitment_requests", "Recruitment Request Management"),
    CANDIDATES("candidates", "Candidate Management"),
    INTERVIEW_STAGES("interview_stages", "Interview Management"),
    
    // Documents & Performance
    DOCUMENTS("documents", "Document Management"),
    PERFORMANCE_REVIEWS("performance_reviews", "Performance Review Management"),
    PERFORMANCE_METRICS("performance_metrics", "Performance Metrics Management"),
    
    // System
    ACTIVITY_LOGS("activity_logs", "Activity Log Viewing"),
    FINGERPRINT_INTEGRATION("fingerprint_integration", "Fingerprint Integration"),
    SETTINGS("settings", "System Settings"),
    REPORTS("reports", "Reports & Analytics");

    private final String code;
    private final String displayName;
}