package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.response.notification.NotificationResponse;
import com.grh.grh.entity.User;
import com.grh.grh.repository.UserRepository;
import com.grh.grh.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtDecoder jwtDecoder;
    private final UserRepository userRepository;

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

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestParam("token") String token) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing token");
        }

        String rawToken = token.startsWith("Bearer ") ? token.substring(7) : token;

        try {
            Jwt jwt = jwtDecoder.decode(rawToken);
            User user = userRepository.findByKeycloakId(jwt.getSubject())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

            return notificationService.registerEmitter(user.getId());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token");
        }
    }
}