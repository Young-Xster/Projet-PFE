package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.attendance.CreateAttendanceRequest;
import com.grh.grh.dto.request.attendance.UpdateAttendanceRequest;
import com.grh.grh.dto.response.attendance.AttendanceResponse;
import com.grh.grh.dto.response.attendance.OvertimeSummaryResponse;
import com.grh.grh.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
public class AttendanceController {
    
    private final AttendanceService attendanceService;

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'attendance:create')")
    public ApiResponse<AttendanceResponse> createAttendance(
        @Valid @RequestBody CreateAttendanceRequest request , Authentication authentication
    ) {
        return ApiResponse.success("Attendance recorded successfully" , attendanceService.createAttendance(request, authentication));
    }

    @PutMapping("/{recordId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'attendance:update')")
    public ApiResponse<AttendanceResponse> updateAttendance(
        @PathVariable UUID recordId,
        @Valid @RequestBody UpdateAttendanceRequest request , 
        Authentication authentication
    ){
        return ApiResponse.success("Attendance record updated successfully" , attendanceService.updateAttendance(recordId, request, authentication));
    }

    @GetMapping("/{recordId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'attendance:read')")
    public ApiResponse<AttendanceResponse> getAttendanceById(
        @PathVariable UUID recordId,
        Authentication authentication
    ) {
        return ApiResponse.success("Attendance retrieved successfully",
            attendanceService.getAttendanceById(recordId, authentication));
    }

    @GetMapping("/company/{companyId}/date/{date}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'attendance:read')")
    public ApiResponse<List<AttendanceResponse>> getAttendanceByCompanyAndDate(
        @PathVariable UUID companyId,
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        Authentication authentication
    ) {
        return ApiResponse.success("Attendance records retrieved successfully",
            attendanceService.getAttendanceByCompanyAndDate(companyId, date, authentication));
    }

    //attendance in a date range for a company
    @GetMapping("/company/{companyId}/range")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'attendance:read')")
    public ApiResponse<List<AttendanceResponse>> getAttendanceByCompanyAndDateRange(
        @PathVariable UUID companyId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        Authentication authentication
    ) {
        return ApiResponse.success("Attendance retrieved successfully",
            attendanceService.getAttendanceByCompanyAndDateRange(companyId, startDate, endDate, authentication));
    }

    //attendance by date range for employee
    @GetMapping("/employee/{employeeId}/range")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'attendance:read')")
    public ApiResponse<List<AttendanceResponse>> getAttendanceByEmployee(
        @PathVariable UUID employeeId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        Authentication authentication
    ) {
        return ApiResponse.success("Attendance retrieved successfully",
            attendanceService.getAttendanceByEmployee(employeeId, startDate, endDate, authentication));
    }

    @DeleteMapping("/{recordId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'attendance:delete')")
    public ApiResponse<Void> deleteAttendance(
        @PathVariable UUID recordId,
        Authentication authentication
    ) {
        attendanceService.deleteAttendance(recordId, authentication);
        return ApiResponse.success("Attendance deleted successfully", null);
    }

    @GetMapping("/company/{companyId}/on-leave")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'attendance:read')")
    public ApiResponse<List<UUID>> getEmployeeIdsOnLeaveForDate(
        @PathVariable UUID companyId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        Authentication authentication
    ) {
        return ApiResponse.success("Employees on leave retrieved successfully",
            attendanceService.getEmployeeIdsOnLeaveForDate(companyId, date, authentication));
    }

    @GetMapping("/company/{companyId}/overtime-summary")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'attendance:read')")
    public ApiResponse<List<OvertimeSummaryResponse>> getMonthlyOvertimeSummary(
        @PathVariable UUID companyId,
        @RequestParam int year,
        @RequestParam int month,
        Authentication authentication
    ) {
        return ApiResponse.success("Monthly overtime summary retrieved successfully",
            attendanceService.getMonthlyOvertimeSummary(companyId, year, month, authentication));
    }

}
