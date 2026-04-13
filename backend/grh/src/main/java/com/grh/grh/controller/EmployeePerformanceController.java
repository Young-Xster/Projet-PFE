package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.response.performance.EmployeePerformanceRatingResponse;
import com.grh.grh.service.EmployeePerformanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/performance-reviews")
@RequiredArgsConstructor
@Slf4j
public class EmployeePerformanceController {

    private final EmployeePerformanceService employeePerformanceService;

    @PostMapping("/company/{companyId}/rate-all")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'employees:read')")
    public ApiResponse<List<EmployeePerformanceRatingResponse>> rateAllEmployeesByCompany(
            @PathVariable UUID companyId
    ) {
        try {
            List<EmployeePerformanceRatingResponse> results =
                employeePerformanceService.rateEmployeesInCompany(companyId);
            return ApiResponse.success("Employees rated successfully", results);
        } catch (Exception ex) {
            log.error("Performance rating failed for company {}: {}", companyId, ex.getMessage());
            return ApiResponse.success("Rating service unavailable, returning empty results", Collections.emptyList());
        }
    }
}
