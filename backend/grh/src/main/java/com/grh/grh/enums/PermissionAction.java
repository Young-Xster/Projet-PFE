package com.grh.grh.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PermissionAction {
    CREATE("create", "Create"),
    READ("read", "Read/View"),
    UPDATE("update", "Update/Edit"),
    DELETE("delete", "Delete"),
    EXPORT("export", "Export Reports"),
    APPROVE("approve", "Approve Requests"),
    IMPORT("import", "Import Data");

    private final String code;
    private final String displayName;
}