package com.grh.grh.service;

import com.grh.grh.dto.request.department.CreateDepartmentRequest;
import com.grh.grh.dto.request.department.UpdateDepartmentRequest;
import com.grh.grh.dto.response.department.DepartmentResponse;
import com.grh.grh.entity.Company;
import com.grh.grh.entity.Department;
import com.grh.grh.entity.Employee;
import com.grh.grh.repository.CompanyRepository;
import com.grh.grh.repository.DepartmentRepository;
import com.grh.grh.repository.EmployeeRepository;
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
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final CompanyRepository companyRepository;
    private final EmployeeRepository employeeRepository;
    private final KeycloakUserService keycloakUserService;

    @Transactional
    public DepartmentResponse createDepartment(CreateDepartmentRequest request, Authentication authentication) {
        UUID companyId = resolveCompanyId(authentication, request.getCompanyId());

        if (departmentRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Department code already exists: " + request.getCode());
        }

        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new IllegalArgumentException("Company not found"));

        Department.DepartmentBuilder builder = Department.builder()
            .company(company)
            .name(request.getName())
            .code(request.getCode())
            .description(request.getDescription());

        if (request.getParentDepartmentId() != null) {
            Department parent = departmentRepository.findById(request.getParentDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Parent department not found"));
            builder.parentDepartment(parent);
        }

        if (request.getManagerId() != null) {
            Employee manager = employeeRepository.findById(request.getManagerId())
                .orElseThrow(() -> new IllegalArgumentException("Manager not found"));
            builder.manager(manager);
        }

        Department department = departmentRepository.save(builder.build());
        log.info("Created department: {} for company: {}", department.getName(), company.getName());
        return mapToResponse(department);
    }

    @Transactional
    public DepartmentResponse updateDepartment(UUID departmentId, UpdateDepartmentRequest request, Authentication authentication) {
        Department department = departmentRepository.findById(departmentId)
            .orElseThrow(() -> new IllegalArgumentException("Department not found"));

        validateCompanyAccess(department.getCompany().getId(), authentication);

        if (request.getName() != null) department.setName(request.getName());
        if (request.getDescription() != null) department.setDescription(request.getDescription());

        if (request.getManagerId() != null) {
            Employee manager = employeeRepository.findById(request.getManagerId())
                .orElseThrow(() -> new IllegalArgumentException("Manager not found"));
            department.setManager(manager);
        }

        if (request.getParentDepartmentId() != null) {
            
            if (request.getParentDepartmentId().equals(departmentId)) {
                throw new IllegalArgumentException("Department cannot be its own parent");
            }
            Department parent = departmentRepository.findById(request.getParentDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Parent department not found"));
            department.setParentDepartment(parent);
        }

        department = departmentRepository.save(department);
        log.info("Updated department: {}", department.getName());
        return mapToResponse(department);
    }

    @Transactional(readOnly = true)
    public DepartmentResponse getDepartmentById(UUID departmentId, Authentication authentication) {
        Department department = departmentRepository.findByIdWithManager(departmentId)
            .orElseThrow(() -> new IllegalArgumentException("Department not found"));
        validateCompanyAccess(department.getCompany().getId(), authentication);
        return mapToResponse(department);
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getDepartmentsByCompany(UUID companyId, Authentication authentication) {
        validateCompanyAccess(companyId, authentication);
        return departmentRepository.findByCompanyId(companyId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getSubDepartments(UUID parentDepartmentId, Authentication authentication) {
        Department parent = departmentRepository.findById(parentDepartmentId)
            .orElseThrow(() -> new IllegalArgumentException("Department not found"));
        validateCompanyAccess(parent.getCompany().getId(), authentication);
        return departmentRepository.findByParentDepartmentId(parentDepartmentId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public void deleteDepartment(UUID departmentId, Authentication authentication) {
        Department department = departmentRepository.findById(departmentId)
            .orElseThrow(() -> new IllegalArgumentException("Department not found"));
        validateCompanyAccess(department.getCompany().getId(), authentication);

        
        List<Employee> activeEmployees = employeeRepository.findByDepartmentId(departmentId)
            .stream()
            .filter(e -> !"terminated".equals(e.getStatus()))
            .collect(Collectors.toList());

        if (!activeEmployees.isEmpty()) {
            throw new IllegalStateException("Cannot delete department with active employees. Reassign them first.");
        }

        departmentRepository.delete(department);
        log.info("Deleted department: {}", department.getName());
    }

    private UUID resolveCompanyId(Authentication authentication, UUID requestCompanyId) {
        UUID companyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (companyId != null) return companyId;
        if (keycloakUserService.isSuperAdmin(authentication) && requestCompanyId != null) {
            return requestCompanyId;
        }
        throw new IllegalStateException("User is not associated with any company");
    }

    private void validateCompanyAccess(UUID companyId, Authentication authentication) {
        if (keycloakUserService.isSuperAdmin(authentication)) return;
        UUID userCompanyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (userCompanyId == null || !userCompanyId.equals(companyId)) {
            throw new SecurityException("Access denied");
        }
    }

    private DepartmentResponse mapToResponse(Department department) {
        DepartmentResponse.DepartmentResponseBuilder builder = DepartmentResponse.builder()
            .id(department.getId())
            .name(department.getName())
            .code(department.getCode())
            .description(department.getDescription())
            .createdAt(department.getCreatedAt())
            .updatedAt(department.getUpdatedAt());

        if (department.getCompany() != null) {
            builder.companyId(department.getCompany().getId())
                   .companyName(department.getCompany().getName());
        }

        if (department.getParentDepartment() != null) {
            builder.parentDepartmentId(department.getParentDepartment().getId())
                   .parentDepartmentName(department.getParentDepartment().getName());
        }

        if (department.getManager() != null) {
            builder.managerId(department.getManager().getEmployeeId())
                   .managerName(department.getManager().getFirstName() + " " + department.getManager().getLastName());
        }

        builder.employeeCount(department.getEmployees() != null ? department.getEmployees().size() : 0);

        return builder.build();
    }
}