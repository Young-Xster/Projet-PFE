package com.grh.grh.service;

import com.grh.grh.dto.request.position.CreatePositionRequest;
import com.grh.grh.dto.request.position.UpdatePositionRequest;
import com.grh.grh.dto.response.position.PositionResponse;
import com.grh.grh.entity.Company;
import com.grh.grh.entity.Department;
import com.grh.grh.entity.Position;
import com.grh.grh.event.ActivityLogEvent;
import com.grh.grh.repository.CompanyRepository;
import com.grh.grh.repository.DepartmentRepository;
import com.grh.grh.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PositionService {
    private final PositionRepository positionRepository;
    private final CompanyRepository companyRepository;
    private final DepartmentRepository departmentRepository;
    private final KeycloakUserService keycloakUserService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public PositionResponse createPosition(CreatePositionRequest request, Authentication authentication) {
        UUID companyId = resolveCompanyId(authentication, request.getCompanyId());

        if (positionRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Position code already exists: " + request.getCode());
        }

        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new IllegalArgumentException("Company not found"));

        Position.PositionBuilder builder = Position.builder()
            .company(company)
            .title(request.getTitle())
            .code(request.getCode())
            .description(request.getDescription())
            .requiredSkills(request.getRequiredSkills())
            .experienceYearsRequired(request.getExperienceYearsRequired());

        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Department not found"));
            builder.department(department);
        }

        Position position = positionRepository.save(builder.build());

        UUID currentUserId = keycloakUserService.getCurrentUserId(authentication);

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(company.getId())
            .userId(currentUserId)
            .action("POSITION_CREATED")
            .entityType("POSITION")
            .entityId(position.getId())
            .build());

        log.info("Created position: {} for company: {}", position.getTitle(), company.getName());
        return mapToResponse(position);
    }

    @Transactional
    public PositionResponse updatePosition(UUID positionId, UpdatePositionRequest request, Authentication authentication) {
        Position position = positionRepository.findById(positionId)
            .orElseThrow(() -> new IllegalArgumentException("Position not found"));

        validateCompanyAccess(position.getCompany().getId(), authentication);

        if (request.getName() != null) position.setTitle(request.getName());
        if (request.getDescription() != null) position.setDescription(request.getDescription());

        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Department not found"));
            position.setDepartment(department);
        }

        position = positionRepository.save(position);

        UUID currentUserId = keycloakUserService.getCurrentUserId(authentication);

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(position.getCompany().getId())
            .userId(currentUserId)
            .action("POSITION_UPDATED")
            .entityType("POSITION")
            .entityId(position.getId())
            .build());

        log.info("Updated position: {}", position.getTitle());
        return mapToResponse(position);
    }

    @Transactional(readOnly = true)
    public PositionResponse getPositionById(UUID positionId, Authentication authentication) {
        Position position = positionRepository.findById(positionId)
            .orElseThrow(() -> new IllegalArgumentException("Position not found"));
        validateCompanyAccess(position.getCompany().getId(), authentication);
        return mapToResponse(position);
    }

    @Transactional(readOnly = true)
    public List<PositionResponse> getPositionsByCompany(UUID companyId, Authentication authentication) {
        validateCompanyAccess(companyId, authentication);
        return positionRepository.findByCompanyId(companyId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PositionResponse> getPositionsByDepartment(UUID departmentId, Authentication authentication) {
        Department department = departmentRepository.findById(departmentId)
            .orElseThrow(() -> new IllegalArgumentException("Department not found"));
        validateCompanyAccess(department.getCompany().getId(), authentication);
        return positionRepository.findByDepartmentId(departmentId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public void deletePosition(UUID positionId, Authentication authentication) {
        Position position = positionRepository.findById(positionId)
            .orElseThrow(() -> new IllegalArgumentException("Position not found"));
        validateCompanyAccess(position.getCompany().getId(), authentication);
        UUID currentUserId = keycloakUserService.getCurrentUserId(authentication);
        UUID companyId = position.getCompany().getId();

        positionRepository.delete(position);

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(companyId)
            .userId(currentUserId)
            .action("POSITION_DELETED")
            .entityType("POSITION")
            .entityId(positionId)
            .build());

        log.info("Deleted position: {}", position.getTitle());
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

    private PositionResponse mapToResponse(Position position) {
        PositionResponse.PositionResponseBuilder builder = PositionResponse.builder()
            .id(position.getId())
            .code(position.getCode())
            .name(position.getTitle())
            .description(position.getDescription())
            .createdAt(position.getCreatedAt());

        if (position.getCompany() != null) {
            builder.companyId(position.getCompany().getId())
                   .companyName(position.getCompany().getName());
        }

        if (position.getDepartment() != null) {
            builder.departmentId(position.getDepartment().getId())
                   .departmentName(position.getDepartment().getName());
        }

        return builder.build();
    }


}
