package com.grh.grh.dto.request.document;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDocumentRequest {
    
    @Size(max = 50)
    private String documentType;
    
    @Size(max = 255)
    private String documentName;
}
