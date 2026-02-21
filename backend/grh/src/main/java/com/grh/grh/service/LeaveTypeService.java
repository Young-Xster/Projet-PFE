package com.grh.grh.service;

import com.grh.grh.dto.request.leave.CreateLeaveTypeRequest;
import com.grh.grh.dto.request.leave.UpdateLeaveTypeRequest;
import com.grh.grh.dto.response.leave.LeaveTypeResponse;
import com.grh.grh.entity.Company;
import com.grh.grh.entity.LeaveType;
import com.grh.grh.repository.CompanyRepository;
import com.grh.grh.repository.LeaveTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaveTypeService {

    private final LeaveTypeRepository leaveTypeRepository;
    private final CompanyRepository companyRepository;
    private final KeycloakUserService keycloakUserService;

    @Transactional
    public LeaveTypeResponse createLeaveType(CreateLeaveTypeRequest request, Authentication authentication) {
        validateCompanyAccess(request.getCompanyId(), authentication);

        if (leaveTypeRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Leave type code already exists: " + request.getCode());
        }

        Company company = companyRepository.findById(request.getCompanyId())
            .orElseThrow(() -> new IllegalArgumentException("Company not found"));

        // defaultDays = per-year allocation; maxDaysPerYear = hard cap (falls back to defaultDays)
        Integer maxDays = request.getMaxDaysPerYear() != null ? request.getMaxDaysPerYear().intValue()
            : (request.getDefaultDays() != null ? request.getDefaultDays().intValue() : null);

        LeaveType leaveType = LeaveType.builder()
            .company(company)
            .code(request.getCode())
            .name(request.getName())
            .description(request.getDescription())
            .isPaid(request.getIsPaid())
            .requiresApproval(request.getRequiresApproval())
            .maxDaysPerYear(maxDays)
            .build();

        leaveType = leaveTypeRepository.save(leaveType);
        log.info("Created leave type: {} for company: {}", leaveType.getName(), company.getName());
        return mapToResponse(leaveType);
    }

    @Transactional
    public LeaveTypeResponse updateLeaveType(UUID leaveTypeId, UpdateLeaveTypeRequest request, Authentication authentication) {
        LeaveType leaveType = leaveTypeRepository.findById(leaveTypeId)
            .orElseThrow(() -> new IllegalArgumentException("Leave type not found"));

        validateCompanyAccess(leaveType.getCompany().getId(), authentication);

        if (request.getName() != null) leaveType.setName(request.getName());
        if (request.getDescription() != null) leaveType.setDescription(request.getDescription());
        if (request.getIsPaid() != null) leaveType.setIsPaid(request.getIsPaid());
        if (request.getRequiresApproval() != null) leaveType.setRequiresApproval(request.getRequiresApproval());
        if (request.getMaxDaysPerYear() != null) leaveType.setMaxDaysPerYear(request.getMaxDaysPerYear().intValue());

        leaveType = leaveTypeRepository.save(leaveType);
        log.info("Updated leave type: {}", leaveType.getName());
        return mapToResponse(leaveType);
    }

    @Transactional(readOnly = true)
    public LeaveTypeResponse getLeaveTypeById(UUID leaveTypeId, Authentication authentication) {
        LeaveType leaveType = leaveTypeRepository.findById(leaveTypeId)
            .orElseThrow(() -> new IllegalArgumentException("Leave type not found"));
        validateCompanyAccess(leaveType.getCompany().getId(), authentication);
        return mapToResponse(leaveType);
    }

    @Transactional(readOnly = true)
    public List<LeaveTypeResponse> getLeaveTypesByCompany(UUID companyId, Authentication authentication) {
        validateCompanyAccess(companyId, authentication);
        return leaveTypeRepository.findByCompanyId(companyId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public void deleteLeaveType(UUID leaveTypeId, Authentication authentication) {
        LeaveType leaveType = leaveTypeRepository.findById(leaveTypeId)
            .orElseThrow(() -> new IllegalArgumentException("Leave type not found"));
        validateCompanyAccess(leaveType.getCompany().getId(), authentication);

        if (!leaveType.getLeaveRequests().isEmpty()) {
            throw new IllegalStateException("Cannot delete leave type with existing leave requests");
        }

        leaveTypeRepository.delete(leaveType);
        log.info("Deleted leave type: {}", leaveType.getName());
    }

    @Transactional(readOnly = true)
    public List<LeaveTypeResponse> getLeaveTypesByCompanyPublic(UUID companyId) {
        return leaveTypeRepository.findByCompanyId(companyId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    private void validateCompanyAccess(UUID companyId, Authentication authentication) {
        if (keycloakUserService.isSuperAdmin(authentication)) return;
        UUID userCompanyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (userCompanyId == null || !userCompanyId.equals(companyId)) {
            throw new SecurityException("Access denied");
        }
    }

    private LeaveTypeResponse mapToResponse(LeaveType leaveType) {
        return LeaveTypeResponse.builder()
            .id(leaveType.getId())
            .code(leaveType.getCode())
            .name(leaveType.getName())
            .description(leaveType.getDescription())
            .isPaid(leaveType.getIsPaid())
            .requiresApproval(leaveType.getRequiresApproval())
            .maxDaysPerYear(leaveType.getMaxDaysPerYear() != null ?
                java.math.BigDecimal.valueOf(leaveType.getMaxDaysPerYear()) : null)
            .companyId(leaveType.getCompany().getId())
            .companyName(leaveType.getCompany().getName())
            .createdAt(leaveType.getCreatedAt())
            .build();
    }
}