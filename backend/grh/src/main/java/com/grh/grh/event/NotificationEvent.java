package com.grh.grh.event;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;
import java.util.UUID;

@Getter
@Builder
public class NotificationEvent {
    private final UUID companyId;
    private final String type;
    private final String title;
    private final String message;
    private final String targetModule;
    private final UUID targetId;
    private final String importance;
    private final Map<String, Object> metadata;
}
