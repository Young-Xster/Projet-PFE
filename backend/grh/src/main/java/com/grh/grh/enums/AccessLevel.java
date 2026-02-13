package com.grh.grh.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AccessLevel {
    FULL_ACCESS("full_access", "Full Access - User has assigned role with permissions"),
    VIEW_ONLY("view_only", "View Only - User has company password but no assigned role");

    private final String code;
    private final String description;
}
