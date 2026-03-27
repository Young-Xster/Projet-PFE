package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.company.CreateCompanyRequest;
import com.grh.grh.dto.response.company.CompanyResponse;
import com.grh.grh.entity.Company;
import com.grh.grh.repository.CompanyRepository;
import com.grh.grh.service.ActivityLogService;
import com.grh.grh.service.KeycloakUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyRepository companyRepository;
    private final KeycloakUserService keycloakUserService;
    private final ActivityLogService activityLogService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<List<CompanyResponse>> getAllCompanies() {
        List<CompanyResponse> companies = companyRepository.findAll().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
        return ApiResponse.success("Companies retrieved", companies);
    }

    @GetMapping("/{companyId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<CompanyResponse> getCompanyById(@PathVariable UUID companyId) {
        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new IllegalArgumentException("Company not found"));
        return ApiResponse.success("Company retrieved", toResponse(company));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<CompanyResponse> createCompany(@RequestBody CreateCompanyRequest request, Authentication authentication) {
        Company company = Company.builder()
            .name(request.getName())
            .code(request.getCode())
            .industryType(request.getIndustryType())
            .address(request.getAdress())
            .phone(request.getPhoneNumber())
            .email(request.getEmail())
            .isActive(true)
            .build();

        company = companyRepository.save(company);
        activityLogService.logActivity(
            company.getId(),
            resolveCurrentUserId(authentication),
            "COMPANY_CREATED",
            "COMPANY",
            company.getId()
        );
        return ApiResponse.success("Company created", toResponse(company));
    }

    @PutMapping("/{companyId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<CompanyResponse> updateCompany(
            @PathVariable UUID companyId,
            @RequestBody CreateCompanyRequest request,
            Authentication authentication) {
        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new IllegalArgumentException("Company not found"));

        if (request.getName() != null) company.setName(request.getName());
        if (request.getCode() != null) company.setCode(request.getCode());
        if (request.getIndustryType() != null) company.setIndustryType(request.getIndustryType());
        if (request.getAdress() != null) company.setAddress(request.getAdress());
        if (request.getPhoneNumber() != null) company.setPhone(request.getPhoneNumber());
        if (request.getEmail() != null) company.setEmail(request.getEmail());

        company = companyRepository.save(company);
        activityLogService.logActivity(
            company.getId(),
            resolveCurrentUserId(authentication),
            "COMPANY_UPDATED",
            "COMPANY",
            company.getId()
        );
        return ApiResponse.success("Company updated", toResponse(company));
    }

    @DeleteMapping("/{companyId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<Void> deleteCompany(@PathVariable UUID companyId, Authentication authentication) {
        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new IllegalArgumentException("Company not found"));

        // Soft delete — just deactivate
        company.setIsActive(false);
        companyRepository.save(company);
        activityLogService.logActivity(
            company.getId(),
            resolveCurrentUserId(authentication),
            "COMPANY_DEACTIVATED",
            "COMPANY",
            company.getId()
        );
        return ApiResponse.success("Company deactivated", null);
    }

    private UUID resolveCurrentUserId(Authentication authentication) {
        try {
            return keycloakUserService.getCurrentUserId(authentication);
        } catch (Exception ex) {
            return null;
        }
    }

    private CompanyResponse toResponse(Company company) {
        return CompanyResponse.builder()
            .id(company.getId())
            .name(company.getName())
            .code(company.getCode())
            .industryType(company.getIndustryType())
            .address(company.getAddress())
            .phone(company.getPhone())
            .email(company.getEmail())
            .isActive(company.getIsActive())
            .createdAt(company.getCreatedAt())
            .updatedAt(company.getUpdatedAt())
            .build();
    }
}