package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.position.CreatePositionRequest;
import com.grh.grh.dto.request.position.UpdatePositionRequest;
import com.grh.grh.dto.response.position.PositionResponse;
import com.grh.grh.service.PositionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/positions")
@RequiredArgsConstructor
public class PositionController {

    private final PositionService positionService;

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'positions:create')")
    public ApiResponse<PositionResponse> createPosition(
        @Valid @RequestBody CreatePositionRequest request,
        Authentication authentication
    ) {
        return ApiResponse.success("Position created successfully",
            positionService.createPosition(request, authentication));
    }

    @PutMapping("/{positionId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'positions:update')")
    public ApiResponse<PositionResponse> updatePosition(
        @PathVariable UUID positionId,
        @Valid @RequestBody UpdatePositionRequest request,
        Authentication authentication
    ) {
        return ApiResponse.success("Position updated successfully",
            positionService.updatePosition(positionId, request, authentication));
    }

    @GetMapping("/{positionId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'positions:read')")
    public ApiResponse<PositionResponse> getPositionById(
        @PathVariable UUID positionId,
        Authentication authentication
    ) {
        return ApiResponse.success("Position retrieved successfully",
            positionService.getPositionById(positionId, authentication));
    }

    @GetMapping("/company/{companyId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'positions:read')")
    public ApiResponse<List<PositionResponse>> getPositionsByCompany(
        @PathVariable UUID companyId,
        Authentication authentication
    ) {
        return ApiResponse.success("Positions retrieved successfully",
            positionService.getPositionsByCompany(companyId, authentication));
    }

    @GetMapping("/department/{departmentId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'positions:read')")
    public ApiResponse<List<PositionResponse>> getPositionsByDepartment(
        @PathVariable UUID departmentId,
        Authentication authentication
    ) {
        return ApiResponse.success("Positions retrieved successfully",
            positionService.getPositionsByDepartment(departmentId, authentication));
    }

    @DeleteMapping("/{positionId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'positions:delete')")
    public ApiResponse<Void> deletePosition(
        @PathVariable UUID positionId,
        Authentication authentication
    ) {
        positionService.deletePosition(positionId, authentication);
        return ApiResponse.success("Position deleted successfully", null);
    }
}