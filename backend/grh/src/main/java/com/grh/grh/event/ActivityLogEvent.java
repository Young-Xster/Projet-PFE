package com.grh.grh.event;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;
import java.util.UUID;

@Getter
@Builder
public class ActivityLogEvent {
    private final UUID companyId;
    private final UUID userId;
    private final String action;
    private final String entityType;
    private final UUID entityId;
    private final Map<String, Object> changes;
    private final String ipAddress;
}
