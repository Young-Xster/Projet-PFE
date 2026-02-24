package com.grh.grh.service;

import com.grh.grh.dto.request.employee.CreateEmployeeRequest;
import com.grh.grh.dto.request.employee.UpdateEmployeeRequest;
import com.grh.grh.dto.response.employee.EmployeeResponse;
import com.grh.grh.entity.*;
import com.grh.grh.repository.*;
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
public class EmployeeService {
    
    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final DepartmentRepository departmentRepository;
    private final KeycloakUserService keycloakUserService;

    @Transactional
    public EmployeeResponse createEmployee(CreateEmployeeRequest request , Authentication authentication){
        UUID companyId = resolveCompanyId(authentication, request.getCompanyId());
        
        if(employeeRepository.existsByEmail(request.getEmail())){
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        if(employeeRepository.existsByNationalId(request.getNationalId())){
            throw new IllegalArgumentException("National ID already exists: " + request.getNationalId());
        }

        Company company = companyRepository.findById(companyId).orElseThrow(() -> new IllegalArgumentException("Company not found"));

        Employee.EmployeeBuilder employeeBuilder = Employee.builder()
            .company(company)
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .email(request.getEmail())
            .phoneNumber(request.getPhoneNumber())
            .dateOfBirth(request.getDateOfBirth())
            .gender(request.getGender())
            .address(request.getAddress())
            .city(request.getCity())
            .postalCode(request.getPostalCode())
            .country(request.getCountry())
            .nationalId(request.getNationalId())
            .hireDate(request.getHireDate())
            .employmentType(request.getEmploymentType())
            .jobTitle(request.getJobTitle())
            .salary(request.getSalary())
            .status("active");

        if(request.getDepartmentId() != null){
            Department department = departmentRepository.findById(request.getDepartmentId()).orElseThrow(() -> new IllegalArgumentException("Department not found"));
            employeeBuilder.department(department);
        }

        if (request.getManagerId() != null) {
            Employee manager = employeeRepository.findById(request.getManagerId())
                .orElseThrow(() -> new IllegalArgumentException("Manager not found"));
            employeeBuilder.manager(manager);
        }


        if (request.getFingerprintId() != null) {
            employeeBuilder.fingerprintId(request.getFingerprintId());
        }

        Employee employee = employeeBuilder.build();
        employee = employeeRepository.save(employee);
        
        log.info("Created employee: {} {} (ID: {})", employee.getFirstName(), employee.getLastName(), employee.getEmployeeId());
        
        return mapToResponse(employee);
    }

    @Transactional
    public EmployeeResponse updateEmployee(UUID emplUuid , UpdateEmployeeRequest request , Authentication authentication){
        Employee employee = employeeRepository.findById(emplUuid).orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        validateCompanyAccess(employee.getCompany().getId() , authentication);

        if(request.getFirstName() != null){
            employee.setFirstName(request.getFirstName());
        }
        if(request.getLastName() != null){
            employee.setLastName(request.getLastName());
        }

        if(request.getEmail() != null ){
            if(!employee.getEmail().equals(request.getEmail()) && employeeRepository.existsByEmail(request.getEmail())){
                throw new IllegalArgumentException("Email already exists: " + request.getEmail());
            }
            employee.setEmail(request.getEmail());
        }

        if (request.getPhoneNumber() != null) {
            employee.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getDateOfBirth() != null) {
            employee.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getGender() != null) {
            employee.setGender(request.getGender());
        }
        if (request.getAddress() != null) {
            employee.setAddress(request.getAddress());
        }
        if (request.getCity() != null) {
            employee.setCity(request.getCity());
        }
        if (request.getPostalCode() != null) {
            employee.setPostalCode(request.getPostalCode());
        }
        if (request.getCountry() != null) {
            employee.setCountry(request.getCountry());
        }

        if (request.getNationalId() != null) {
            if (!employee.getNationalId().equals(request.getNationalId()) && 
                employeeRepository.existsByNationalId(request.getNationalId())) {
                throw new IllegalArgumentException("National ID already exists: " + request.getNationalId());
            }
            employee.setNationalId(request.getNationalId());
        }

        if(request.getHireDate() != null){
            employee.setHireDate(request.getHireDate());
        }
        if (request.getTerminationDate() != null) {
            employee.setTerminationDate(request.getTerminationDate());
        }
        if (request.getEmploymentType() != null) {
            employee.setEmploymentType(request.getEmploymentType());
        }
        if (request.getJobTitle() != null) {
            employee.setJobTitle(request.getJobTitle());
        }
        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Department not found"));
            employee.setDepartment(department);
        }
        if (request.getManagerId() != null) {
            Employee manager = employeeRepository.findById(request.getManagerId())
                .orElseThrow(() -> new IllegalArgumentException("Manager not found"));
            employee.setManager(manager);
        }
        if (request.getSalary() != null) {
            employee.setSalary(request.getSalary());
        }
        if (request.getStatus() != null) {
            employee.setStatus(request.getStatus());
        }
        if (request.getFingerprintId() != null) {
            employee.setFingerprintId(request.getFingerprintId());
        }
        if (request.getPhotoPath() != null) {
            employee.setPhotoPath(request.getPhotoPath());
        }
        
        employee = employeeRepository.save(employee);
        
        log.info("Updated employee: {} {} (ID: {})", employee.getFirstName(), employee.getLastName(), employee.getEmployeeId());
        
        return mapToResponse(employee);

    }

    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeById(UUID employeeId , Authentication authentication){
        Employee employee = employeeRepository.findByIdWithDetails(employeeId)
            .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        validateCompanyAccess(employee.getCompany().getId() , authentication);
        return mapToResponse(employee);
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllEmployeesByCompany(UUID companyId , Authentication authentication){
        validateCompanyAccess(companyId , authentication);

        return employeeRepository.findByCompanyId(companyId).stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllEmployeesByCompanyIncludingTerminated(UUID companyId, Authentication authentication) {
        validateCompanyAccess(companyId, authentication);
        
        return employeeRepository.findAllByCompanyIdIncludingTerminated(companyId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public List<EmployeeResponse> getEmployeesByDepartment(UUID departmentId, Authentication authentication) {
        Department department = departmentRepository.findById(departmentId)
            .orElseThrow(() -> new IllegalArgumentException("Department not found"));
        
        validateCompanyAccess(department.getCompany().getId(), authentication);
        
        return employeeRepository.findByDepartmentId(departmentId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public void deleteEmployee(UUID employeeId , Authentication authentication){
        Employee employee = employeeRepository.findById(employeeId).orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        validateCompanyAccess(employee.getCompany().getId() , authentication);
        
        
        employee.setStatus("terminated");
        employee.setTerminationDate(java.time.LocalDate.now());
        employeeRepository.save(employee);
        
        log.info("Deleted employee: {} {} (ID: {})", employee.getFirstName(), employee.getLastName(), employee.getEmployeeId());
    }

    private UUID resolveCompanyId(Authentication authentication, UUID requestCompanyId) {
        UUID companyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (companyId != null) return companyId;
        if (keycloakUserService.isSuperAdmin(authentication) && requestCompanyId != null) {
            return requestCompanyId;
        }
        throw new IllegalStateException("User is not associated with any company");
    }

    private void validateCompanyAccess(UUID companyId , Authentication authentication){
        if (keycloakUserService.isSuperAdmin(authentication)) {
            return;
        }
        
        UUID userCompanyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (userCompanyId == null || !userCompanyId.equals(companyId)) {
            throw new SecurityException("Access denied: You do not have permission to access this company's data");
        }
    }

    private EmployeeResponse mapToResponse(Employee employee) {
        EmployeeResponse.EmployeeResponseBuilder builder = EmployeeResponse.builder()
            .employeeId(employee.getEmployeeId())
            .firstName(employee.getFirstName())
            .lastName(employee.getLastName())
            .email(employee.getEmail())
            .phoneNumber(employee.getPhoneNumber())
            .jobTitle(employee.getJobTitle())
            .employmentType(employee.getEmploymentType())
            .status(employee.getStatus())
            .hireDate(employee.getHireDate())
            .salary(employee.getSalary())
            .photoPath(employee.getPhotoPath())
            .createdAt(employee.getCreatedAt())
            .updatedAt(employee.getUpdatedAt());

    if (employee.getCompany() != null) {
            builder.company(EmployeeResponse.CompanyInfo.builder()
                .id(employee.getCompany().getId())
                .name(employee.getCompany().getName())
                .code(employee.getCompany().getCode())
                .build());
    }

    if (employee.getDepartment() != null) {
            builder.department(EmployeeResponse.DepartmentInfo.builder()
                .id(employee.getDepartment().getId())
                .name(employee.getDepartment().getName())
                .code(employee.getDepartment().getCode())
                .build());
        }
    if (employee.getManager() != null) {
            builder.manager(EmployeeResponse.ManagerInfo.builder()
                .id(employee.getManager().getEmployeeId())
                .fullName(employee.getManager().getFirstName() + " " + employee.getManager().getLastName())
                .email(employee.getManager().getEmail())
                .build());
    }
        
        return builder.build();
    }
}
