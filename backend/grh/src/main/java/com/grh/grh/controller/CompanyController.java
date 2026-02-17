package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.company.CreateCompanyRequest;
import com.grh.grh.dto.response.company.CompanyResponse;
import com.grh.grh.entity.Company;
import com.grh.grh.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyRepository companyRepository;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<List<CompanyResponse>> getAllCompanies() {
        List<CompanyResponse> companies = companyRepository.findAll().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
        return ApiResponse.success("Companies retrieved", companies);
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<CompanyResponse> createCompany(@RequestBody CreateCompanyRequest request) {
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
        return ApiResponse.success("Company created", toResponse(company));
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