package com.grh.grh.dto.response.notification;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private UUID id;
    private UUID companyId;
    private String type;
    private String title;
    private String message;
    private String importance;
    private String targetModule;
    private UUID targetId;
    private Boolean isRead;
    private OffsetDateTime createdAt;
}