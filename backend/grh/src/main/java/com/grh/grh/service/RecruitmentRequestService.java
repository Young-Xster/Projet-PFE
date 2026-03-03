package com.grh.grh.service;

import com.grh.grh.dto.request.recruitment.CreateRecruitmentRequestRequest;
import com.grh.grh.dto.response.recruitment.RecruitmentRequestResponse;
import com.grh.grh.entity.*;
import com.grh.grh.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecruitmentRequestService {

    private final RecruitmentRequestRepository recruitmentRequestRepository;
    private final CompanyRepository companyRepository;
    private final PositionRepository positionRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final KeycloakUserService keycloakUserService;

    // ═══════════════════════════════════════════════════════════════════════
    // CREATE
    // ═══════════════════════════════════════════════════════════════════════

    @Transactional
    public RecruitmentRequestResponse create(CreateRecruitmentRequestRequest request, Authentication auth) {
        UUID companyId = resolveCompanyId(auth, request.getCompanyId());
        validateCompanyAccess(companyId, auth);

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company not found"));
        Position position = positionRepository.findById(request.getPositionId())
                .orElseThrow(() -> new IllegalArgumentException("Position not found"));
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Department not found"));

        // Resolve requesting user
        User requestedBy = null;
        try {
            UUID currentUserId = keycloakUserService.getCurrentUserId(auth);
            requestedBy = userRepository.findById(currentUserId).orElse(null);
        } catch (Exception ignored) {}

        RecruitmentRequest rr = RecruitmentRequest.builder()
                .company(company)
                .position(position)
                .department(department)
                .requestedBy(requestedBy)
                .numberOfPositions(request.getNumberOfPositions())
                .urgencyLevel(request.getPriority() != null ? request.getPriority() : "low")
                .jobDescription(request.getJobDescription())
                .employmentType("full-time")
                .status(request.getStatus() != null ? request.getStatus() : "open")
                .deadline(request.getRequiredByDate())
                .build();

        rr = recruitmentRequestRepository.save(rr);
        log.info("Created recruitment request for position '{}' in company {}", position.getTitle(), companyId);
        return mapToResponse(rr);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // READ
    // ═══════════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public RecruitmentRequestResponse getById(UUID id, Authentication auth) {
        RecruitmentRequest rr = recruitmentRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recruitment request not found"));
        validateCompanyAccess(rr.getCompany().getId(), auth);
        return mapToResponse(rr);
    }

    @Transactional(readOnly = true)
    public List<RecruitmentRequestResponse> getByCompany(UUID companyId, Authentication auth) {
        validateCompanyAccess(companyId, auth);
        return recruitmentRequestRepository.findByCompanyId(companyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RecruitmentRequestResponse> getByCompanyAndStatus(UUID companyId, String status, Authentication auth) {
        validateCompanyAccess(companyId, auth);
        return recruitmentRequestRepository.findByCompanyIdAndStatus(companyId, status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RecruitmentRequestResponse> getByDepartment(UUID departmentId, Authentication auth) {
        List<RecruitmentRequest> list = recruitmentRequestRepository.findByDepartmentId(departmentId);
        if (!list.isEmpty()) validateCompanyAccess(list.get(0).getCompany().getId(), auth);
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // APPROVE / REJECT / CANCEL
    // ═══════════════════════════════════════════════════════════════════════

    @Transactional
    public RecruitmentRequestResponse approve(UUID id, Authentication auth) {
        RecruitmentRequest rr = recruitmentRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recruitment request not found"));
        validateCompanyAccess(rr.getCompany().getId(), auth);

        if (!"open".equalsIgnoreCase(rr.getStatus())) {
            throw new IllegalStateException("Only open requests can be approved. Current status: " + rr.getStatus());
        }

        User approver = null;
        try {
            UUID currentUserId = keycloakUserService.getCurrentUserId(auth);
            approver = userRepository.findById(currentUserId).orElse(null);
        } catch (Exception ignored) {}

        rr.setStatus("in_progress");
        rr.setApprovedBy(approver);
        rr.setApprovedAt(OffsetDateTime.now());
        rr = recruitmentRequestRepository.save(rr);

        log.info("Approved recruitment request: {}", id);
        return mapToResponse(rr);
    }

    @Transactional
    public RecruitmentRequestResponse reject(UUID id, Authentication auth) {
        RecruitmentRequest rr = recruitmentRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recruitment request not found"));
        validateCompanyAccess(rr.getCompany().getId(), auth);

        if (!"open".equalsIgnoreCase(rr.getStatus())) {
            throw new IllegalStateException("Only open requests can be rejected. Current status: " + rr.getStatus());
        }

        rr.setStatus("cancelled");
        rr = recruitmentRequestRepository.save(rr);

        log.info("Rejected recruitment request: {}", id);
        return mapToResponse(rr);
    }

    @Transactional
    public RecruitmentRequestResponse markFilled(UUID id, Authentication auth) {
        RecruitmentRequest rr = recruitmentRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recruitment request not found"));
        validateCompanyAccess(rr.getCompany().getId(), auth);

        rr.setStatus("filled");
        rr = recruitmentRequestRepository.save(rr);

        log.info("Marked recruitment request as filled: {}", id);
        return mapToResponse(rr);
    }

    @Transactional
    public void delete(UUID id, Authentication auth) {
        RecruitmentRequest rr = recruitmentRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recruitment request not found"));
        validateCompanyAccess(rr.getCompany().getId(), auth);

        if (!rr.getCandidates().isEmpty()) {
            throw new IllegalStateException(
                    "Cannot delete — " + rr.getCandidates().size() + " candidate(s) linked to this request");
        }

        recruitmentRequestRepository.delete(rr);
        log.info("Deleted recruitment request: {}", id);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    private UUID resolveCompanyId(Authentication auth, UUID requestCompanyId) {
        if (keycloakUserService.isSuperAdmin(auth)) {
            if (requestCompanyId == null)
                throw new IllegalArgumentException("companyId is required for super admin");
            return requestCompanyId;
        }
        UUID cid = keycloakUserService.getCurrentUserCompanyId(auth);
        if (cid == null) throw new IllegalStateException("User has no company");
        return cid;
    }

    private void validateCompanyAccess(UUID companyId, Authentication auth) {
        if (keycloakUserService.isSuperAdmin(auth)) return;
        UUID userCid = keycloakUserService.getCurrentUserCompanyId(auth);
        if (userCid == null || !userCid.equals(companyId))
            throw new SecurityException("Access denied");
    }

    private RecruitmentRequestResponse mapToResponse(RecruitmentRequest rr) {
        return RecruitmentRequestResponse.builder()
                .id(rr.getId())
                .companyId(rr.getCompany().getId())
                .companyName(rr.getCompany().getName())
                .positionId(rr.getPosition() != null ? rr.getPosition().getId() : null)
                .positionName(rr.getPosition() != null ? rr.getPosition().getTitle() : null)
                .departmentId(rr.getDepartment() != null ? rr.getDepartment().getId() : null)
                .departmentName(rr.getDepartment() != null ? rr.getDepartment().getName() : null)
                .numberOfPositions(rr.getNumberOfPositions())
                .priority(rr.getUrgencyLevel())
                .requiredByDate(rr.getDeadline())
                .status(rr.getStatus())
                .candidatesCount(rr.getCandidates() != null ? rr.getCandidates().size() : 0)
                .createdAt(rr.getCreatedAt())
                .build();
    }
}