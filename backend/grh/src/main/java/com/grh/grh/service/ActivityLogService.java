package com.grh.grh.service;

import com.grh.grh.entity.ActivityLog;
import com.grh.grh.entity.Company;
import com.grh.grh.entity.User;
import com.grh.grh.repository.ActivityLogRepository;
import com.grh.grh.repository.CompanyRepository;
import com.grh.grh.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLogService {
    private final ActivityLogRepository activityLogRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final KeycloakUserService keycloakUserService;

    @Transactional
    public void logActivity(UUID companyId, UUID userId, String action, String entityType, UUID entityId, Map<String, Object> changes, String ipAddress) {
        if (companyId == null) {
            log.warn("Skipping activity log {} for {} because companyId is null", action, entityType);
            return;
        }

        Company company = companyRepository.findById(companyId)
                .orElse(null);

        if (company == null) {
            log.warn("Skipping activity log {} for {} because company {} was not found", action, entityType, companyId);
            return;
        }

        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        ActivityLog entry = ActivityLog.builder()
                .company(company)
                .user(user)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .changes(changes)
                .ipAddress(ipAddress)
                .build();

        activityLogRepository.save(entry);
        log.debug("Activity logged: {} on {} {} for company {}", action, entityType, entityId, companyId);
    }

    // without ip adress 
    @Transactional
    public void logActivity(UUID companyId, UUID userId, String action,
                            String entityType, UUID entityId) {
        logActivity(companyId, userId, action, entityType, entityId, null, null);
    }

    // read

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAll(Authentication auth) {
        if (!keycloakUserService.isSuperAdmin(auth)) {
            throw new SecurityException("Access denied");
        }

        return activityLogRepository.findAll().stream()
                .sorted(Comparator.comparing(ActivityLog::getCreatedAt).reversed())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllByDateRange(LocalDate startDate, LocalDate endDate, Authentication auth) {
        if (!keycloakUserService.isSuperAdmin(auth)) {
            throw new SecurityException("Access denied");
        }
        OffsetDateTime start = startDate.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime end = endDate.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        return activityLogRepository.findByCreatedAtBetween(start, end).stream()
                .sorted(Comparator.comparing(ActivityLog::getCreatedAt).reversed())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getByCompany(UUID companyId, Authentication auth) {
        validateCompanyAccess(companyId, auth);
        return activityLogRepository.findByCompanyId(companyId).stream()
                .sorted(Comparator.comparing(ActivityLog::getCreatedAt).reversed())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getByCompanyAndDateRange(
            UUID companyId, LocalDate startDate, LocalDate endDate, Authentication auth) {
        validateCompanyAccess(companyId, auth);
        OffsetDateTime start = startDate.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime end = endDate.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        return activityLogRepository.findByCreatedAtBetween(start, end).stream()
                .filter(al -> al.getCompany().getId().equals(companyId))
            .sorted(Comparator.comparing(ActivityLog::getCreatedAt).reversed())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getByUser(UUID userId, Authentication auth) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (targetUser.getCompanyId() != null) {
            validateCompanyAccess(targetUser.getCompanyId(), auth);
        } else if (!keycloakUserService.isSuperAdmin(auth)) {
            throw new SecurityException("Access denied");
        }
        return activityLogRepository.findByUserId(userId).stream()
            .sorted(Comparator.comparing(ActivityLog::getCreatedAt).reversed())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getByEntity(UUID entityId, Authentication auth) {
        List<ActivityLog> logs = activityLogRepository.findByEntityId(entityId);
        if (!logs.isEmpty() && !keycloakUserService.isSuperAdmin(auth)) {
            validateCompanyAccess(logs.get(0).getCompany().getId(), auth);
        }
        return logs.stream()
                .sorted(Comparator.comparing(ActivityLog::getCreatedAt).reversed())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    //helper methods

    private void validateCompanyAccess(UUID companyId, Authentication auth) {
        if (keycloakUserService.isSuperAdmin(auth)) return;
        UUID userCid = keycloakUserService.getCurrentUserCompanyId(auth);
        if (userCid == null || !userCid.equals(companyId))
            throw new SecurityException("Access denied");
    }

    private Map<String, Object> mapToResponse(ActivityLog al) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", al.getId());
        m.put("companyId", al.getCompany().getId());
        m.put("userId", al.getUser() != null ? al.getUser().getId() : null);
        m.put("username", al.getUser() != null ? al.getUser().getUsername() : null);
        m.put("action", al.getAction());
        m.put("entityType", al.getEntityType());
        m.put("entityId", al.getEntityId());
        m.put("changes", al.getChanges());
        m.put("ipAddress", al.getIpAddress());
        m.put("createdAt", al.getCreatedAt());
        return m;
    }

}
