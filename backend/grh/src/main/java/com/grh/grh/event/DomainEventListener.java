package com.grh.grh.event;

import com.grh.grh.service.ActivityLogService;
import com.grh.grh.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DomainEventListener {
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;

    @Async
    @EventListener
    public void handleNotificationEvent(NotificationEvent event) {
        try {
            notificationService.createNotification(
                event.getCompanyId(),
                event.getType(),
                event.getTitle(),
                event.getMessage(),
                event.getTargetModule(),
                event.getTargetId(),
                event.getImportance()
            );
        } catch (Exception e) {
            log.error("Failed to create notification event: {} - {}", event.getType(), e.getMessage(), e);
        }
    }

    @Async
    @EventListener
    public void handleActivityLogEvent(ActivityLogEvent event) {
        try {
            activityLogService.logActivity(
                event.getCompanyId(),
                event.getUserId(),
                event.getAction(),
                event.getEntityType(),
                event.getEntityId(),
                event.getChanges(),
                event.getIpAddress()
            );
        } catch (Exception e) {
            log.error("Failed to create activity log event: {} on {} {} - {}",
                event.getAction(), event.getEntityType(), event.getEntityId(), e.getMessage(), e);
        }
    }
}
