package com.grh.grh.dto.response.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private String documentType;
    private String documentName;
    private String filePath;
    private Long fileSize;
    private String mimeType;
    private UUID companyId;
    private String companyName;
    private OffsetDateTime uploadedAt;
}
