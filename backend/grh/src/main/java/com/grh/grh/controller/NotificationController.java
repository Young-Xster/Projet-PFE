package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.response.notification.NotificationResponse;
import com.grh.grh.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<List<NotificationResponse>> getMyNotifications(Authentication authentication) {
        return ApiResponse.success("Notifications retrieved",
            notificationService.getMyNotifications(authentication));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> getUnreadCount(Authentication authentication) {
        return ApiResponse.success("Unread count retrieved",
            Map.of("count", notificationService.getUnreadCount(authentication)));
    }

    @PostMapping("/{id}/mark-read")
    public ApiResponse<NotificationResponse> markRead(
        @PathVariable UUID id, Authentication authentication
    ) {
        return ApiResponse.success("Notification marked as read",
            notificationService.markRead(id, authentication));
    }

    @PostMapping("/mark-all-read")
    public ApiResponse<Void> markAllRead(Authentication authentication) {
        notificationService.markAllRead(authentication);
        return ApiResponse.success("All notifications marked as read", null);
    }
}