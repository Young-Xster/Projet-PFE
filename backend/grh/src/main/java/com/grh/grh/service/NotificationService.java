package com.grh.grh.service;

import com.grh.grh.dto.response.notification.NotificationResponse;
import com.grh.grh.entity.Company;
import com.grh.grh.entity.Notification;
import com.grh.grh.entity.NotificationRecipient;
import com.grh.grh.entity.User;
import com.grh.grh.repository.CompanyRepository;
import com.grh.grh.repository.NotificationRepository;
import com.grh.grh.repository.NotificationRecipientRepository;
import com.grh.grh.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository notificationRecipientRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final KeycloakUserService keycloakUserService;
    private final Map<UUID, CopyOnWriteArrayList<SseEmitter>> emittersByUser = new ConcurrentHashMap<>();

    public SseEmitter registerEmitter(UUID userId) {
        SseEmitter emitter = new SseEmitter(0L);
        emittersByUser.computeIfAbsent(userId, id -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError((ex) -> removeEmitter(userId, emitter));

        try {
            emitter.send(SseEmitter.event().name("connected").data("connected"));
        } catch (Exception ex) {
            removeEmitter(userId, emitter);
        }

        return emitter;
    }

    @Transactional
    public void createNotification( UUID companyId , String type , String title , String message , String targetModule , UUID targetId){
        createNotification(companyId, type, title, message, targetModule, targetId, "MEDIUM");
    }

    @Transactional
    public void createNotification(
        UUID companyId,
        String type,
        String title,
        String message,
        String targetModule,
        UUID targetId,
        String importance
    ) {
        if (targetId != null &&
            !"SUBCONTRACTOR_PORTAL_PROFILE_UPDATED".equalsIgnoreCase(type) &&
            notificationRepository.existsByCompanyIdAndTypeAndTargetId(companyId, type, targetId)) {
            return;
        }

        Company company = companyRepository.findById(companyId).orElseThrow(() -> new IllegalArgumentException("Company not found"));

        Notification notification = Notification.builder()
            .company(company)
            .type(type)
            .title(title)
            .message(message)
            .importance(importance != null ? importance : "MEDIUM")
            .targetModule(targetModule)
            .targetId(targetId)
            .isRead(false)
            .build();

        Notification saved = notificationRepository.save(notification);

        List<User> companyUsers = userRepository.findByCompanyIdAndIsActiveTrue(companyId);
        List<User> superAdmins = userRepository.findByIsSuperAdminTrueAndIsActiveTrue();

        Map<UUID, User> recipientUsers = new LinkedHashMap<>();
        companyUsers.forEach(user -> recipientUsers.put(user.getId(), user));
        superAdmins.forEach(user -> recipientUsers.put(user.getId(), user));

        if (recipientUsers.isEmpty()) {
            log.warn("Notification [{}] created for company {} but no active users found", type, companyId);
            return;
        }

        List<NotificationRecipient> recipients = recipientUsers.values().stream()
            .map(user -> NotificationRecipient.builder()
                .notification(saved)
                .user(user)
                .isRead(false)
                .build())
            .toList();

        notificationRecipientRepository.saveAll(recipients);

        for (NotificationRecipient recipient : recipients) {
            NotificationResponse response = mapToResponse(saved, recipient.getIsRead());
            sendToUser(recipient.getUser().getId(), response);
        }

        log.info("Created notification [{}] for company {} with {} recipients: {}",
            type, companyId, recipients.size(), title);
    }

    //get all notifs for a company

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(Authentication authentication) {
        UUID userId = keycloakUserService.getCurrentUserId(authentication);
        return notificationRecipientRepository
            .findByUserIdOrderByNotificationCreatedAtDesc(userId)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Authentication authentication) {
        UUID userId = keycloakUserService.getCurrentUserId(authentication);
        return notificationRecipientRepository.countByUserIdAndIsReadFalse(userId);
    }

    // mark read
    @Transactional
    public NotificationResponse markRead(UUID notificationId, Authentication authentication) {
        UUID userId = keycloakUserService.getCurrentUserId(authentication);

        NotificationRecipient recipient = notificationRecipientRepository
            .findByNotificationIdAndUserId(notificationId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        recipient.setIsRead(true);
        recipient.setReadAt(OffsetDateTime.now());
        recipient = notificationRecipientRepository.save(recipient);
        return mapToResponse(recipient);
    }

    @Transactional
    public void markAllRead(Authentication authentication) {
        UUID userId = keycloakUserService.getCurrentUserId(authentication);
        notificationRecipientRepository.markAllReadByUserId(userId);
        log.info("Marked all notifications as read for user {}", userId);
    }

    // helper methods
    private NotificationResponse mapToResponse(NotificationRecipient recipient) {
        Notification n = recipient.getNotification();
        return mapToResponse(n, recipient.getIsRead());
    }

    private NotificationResponse mapToResponse(Notification n, Boolean isRead) {
        return NotificationResponse.builder()
            .id(n.getId())
            .companyId(n.getCompany().getId())
            .type(n.getType())
            .title(n.getTitle())
            .message(n.getMessage())
            .importance(n.getImportance())
            .targetModule(n.getTargetModule())
            .targetId(n.getTargetId())
            .isRead(isRead)
            .createdAt(n.getCreatedAt())
            .build();
    }

    private void sendToUser(UUID userId, NotificationResponse notification) {
        List<SseEmitter> emitters = emittersByUser.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(notification));
            } catch (Exception ex) {
                removeEmitter(userId, emitter);
            }
        }
    }

    private void removeEmitter(UUID userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = emittersByUser.get(userId);
        if (emitters == null) {
            return;
        }

        emitters.remove(emitter);
        if (emitters.isEmpty()) {
            emittersByUser.remove(userId);
        }
    }

}
