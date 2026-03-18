package com.grh.grh.dto.request.document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadDocumentRequest {
    
    @NotNull(message = "Employee ID is required")
    private UUID employeeId;

    private UUID companyId;
    
    @NotBlank(message = "Document type is required")
    @Size(max = 50)
    private String documentType; // contract, id_card, certificate, etc.
    
    @NotBlank(message = "Document name is required")
    @Size(max = 255)
    private String documentName;
    
    // Note: MultipartFile is handled separately in controller, not in DTO
}
