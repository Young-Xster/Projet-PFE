package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.leave.ApproveLeaveRequest;
import com.grh.grh.dto.request.leave.CreateLeaveRequestRequest;
import com.grh.grh.dto.request.leave.PublicLeaveRequest;
import com.grh.grh.dto.request.leave.UpdateLeaveRequestRequest;
import com.grh.grh.dto.response.leave.LeaveBalanceResponse;
import com.grh.grh.dto.response.leave.LeaveRequestDetailResponse;
import com.grh.grh.dto.response.leave.LeaveRequestResponse;
import com.grh.grh.service.LeaveRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/leave-requests")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;

    @PostMapping("/public/submit")
    public ApiResponse<LeaveRequestResponse> submitLeaveRequest(
        @Valid @RequestBody PublicLeaveRequest request
    ) {
        LeaveRequestResponse response = leaveRequestService.submitPublicLeaveRequest(request);
        return ApiResponse.success("Leave request submitted successfully. You will be notified by email.", response);
    }

    @PostMapping("/{leaveRequestId}/review")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'leave_requests:approve')")
    public ApiResponse<LeaveRequestDetailResponse> reviewLeaveRequest(
        @PathVariable UUID leaveRequestId,
        @Valid @RequestBody ApproveLeaveRequest request,
        Authentication authentication
    ) {
        return ApiResponse.success("Leave request reviewed successfully",
            leaveRequestService.approveOrRejectLeaveRequest(leaveRequestId, request, authentication));
    }

    @GetMapping("/{leaveRequestId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'leave_requests:read')")
    public ApiResponse<LeaveRequestDetailResponse> getLeaveRequestById(
        @PathVariable UUID leaveRequestId,
        Authentication authentication
    ) {
        return ApiResponse.success("Leave request retrieved successfully",
            leaveRequestService.getLeaveRequestById(leaveRequestId, authentication));
    }

     @GetMapping("/company/{companyId}/pending")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'leave_requests:read')")
    public ApiResponse<List<LeaveRequestResponse>> getPendingLeaveRequests(
        @PathVariable UUID companyId,
        Authentication authentication
    ) {
        return ApiResponse.success("Pending leave requests retrieved",
            leaveRequestService.getLeaveRequestsByCompanyAndStatus(companyId, "pending", authentication));
    }

    @GetMapping("/company/{companyId}/status/{status}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'leave_requests:read')")
    public ApiResponse<List<LeaveRequestResponse>> getLeaveRequestsByStatus(
        @PathVariable UUID companyId,
        @PathVariable String status,
        Authentication authentication
    ) {
        return ApiResponse.success("Leave requests retrieved successfully",
            leaveRequestService.getLeaveRequestsByCompanyAndStatus(companyId, status, authentication));
    }

    @GetMapping("/employee/{employeeId}/balances")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'leave_balances:read')")
    public ApiResponse<List<LeaveBalanceResponse>> getEmployeeLeaveBalances(
        @PathVariable UUID employeeId,
        Authentication authentication
    ) {
        return ApiResponse.success("Leave balances retrieved successfully",
            leaveRequestService.getEmployeeLeaveBalances(employeeId, authentication));
    }

    @PostMapping("/{leaveRequestId}/cancel")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'leave_requests:update')")
    public ApiResponse<Void> cancelLeaveRequest(
        @PathVariable UUID leaveRequestId,
        Authentication authentication
    ) {
        leaveRequestService.cancelLeaveRequest(leaveRequestId, authentication);
        return ApiResponse.success("Leave request cancelled", null);
    }


}
