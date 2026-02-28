package com.grh.grh.service;

import com.grh.grh.dto.response.notification.NotificationResponse;
import com.grh.grh.entity.Company;
import com.grh.grh.entity.Notification;
import com.grh.grh.repository.CompanyRepository;
import com.grh.grh.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Key;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final CompanyRepository companyRepository;
    private final KeycloakUserService keycloakUserService;

    @Transactional
    public void createNotification( UUID companyId , String type , String title , String message , String targetModule , UUID targetId){
        if (targetId != null &&
            notificationRepository.existsByCompanyIdAndTypeAndTargetId(companyId, type, targetId)) {
            return;
        }

        Company company = companyRepository.findById(companyId).orElseThrow(() -> new IllegalArgumentException("Company not found"));

        Notification notification = Notification.builder()
            .company(company)
            .type(type)
            .title(title)
            .message(message)
            .targetModule(targetModule)
            .targetId(targetId)
            .isRead(false)
            .build();

        notificationRepository.save(notification);
        log.info("Created notification [{}] for company {}: {}", type, companyId, title);
    }

    //get all notifs for a company

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(Authentication authentication) {
        UUID companyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (companyId == null) {
            return List.of();
        }

        return notificationRepository
            .findByCompanyIdOrderByCreatedAtDesc(companyId)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Authentication authentication) {
        UUID companyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (companyId == null) return 0;
        return notificationRepository.countByCompanyIdAndIsReadFalse(companyId);
    }

    // mark read
    @Transactional
    public NotificationResponse markRead(UUID notificationId, Authentication authentication) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        validateCompanyAccess(notification.getCompany().getId(), authentication);

        notification.setIsRead(true);
        notification = notificationRepository.save(notification);
        return mapToResponse(notification);
    }

    @Transactional
    public void markAllRead(Authentication authentication) {
        UUID companyId = resolveCompanyId(authentication);
        notificationRepository.markAllReadByCompanyId(companyId);
        log.info("Marked all notifications as read for company {}", companyId);
    }

    // helper methods
    private UUID resolveCompanyId(Authentication authentication) {
        UUID companyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (companyId == null && !keycloakUserService.isSuperAdmin(authentication)) {
            throw new IllegalStateException("No company associated with current user");
        }
        return companyId;
    }

    private void validateCompanyAccess(UUID companyId, Authentication authentication) {
        if (keycloakUserService.isSuperAdmin(authentication)) return;
        UUID userCompanyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (userCompanyId == null || !userCompanyId.equals(companyId)) {
            throw new SecurityException("Access denied");
        }
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
            .id(n.getId())
            .companyId(n.getCompany().getId())
            .type(n.getType())
            .title(n.getTitle())
            .message(n.getMessage())
            .targetModule(n.getTargetModule())
            .targetId(n.getTargetId())
            .isRead(n.getIsRead())
            .createdAt(n.getCreatedAt())
            .build();
    }

}
