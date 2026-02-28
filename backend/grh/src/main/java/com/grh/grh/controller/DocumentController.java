package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.document.UpdateDocumentRequest;
import com.grh.grh.dto.request.document.UploadDocumentRequest;
import com.grh.grh.dto.response.document.DocumentResponse;
import com.grh.grh.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'documents:create')")
    public ApiResponse<DocumentResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @Valid @ModelAttribute UploadDocumentRequest request,
            Authentication authentication) {
        return ApiResponse.success("Document uploaded successfully",
                documentService.uploadDocument(file, request, authentication));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'documents:read')")
    public ApiResponse<List<DocumentResponse>> getDocumentsByEmployee(
            @PathVariable UUID employeeId,
            Authentication authentication) {
        return ApiResponse.success("Documents retrieved successfully",
                documentService.getDocumentsByEmployee(employeeId, authentication));
    }

    @GetMapping("/{documentId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'documents:read')")
    public ApiResponse<DocumentResponse> getDocumentById(
            @PathVariable UUID documentId,
            Authentication authentication) {
        return ApiResponse.success("Document retrieved successfully",
                documentService.getDocumentById(documentId, authentication));
    }

    @PutMapping("/{documentId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'documents:update')")
    public ApiResponse<DocumentResponse> updateDocument(
            @PathVariable UUID documentId,
            @Valid @RequestBody UpdateDocumentRequest request,
            Authentication authentication) {
        return ApiResponse.success("Document updated successfully",
                documentService.updateDocument(documentId, request, authentication));
    }

    @DeleteMapping("/{documentId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'documents:delete')")
    public ApiResponse<Void> deleteDocument(
            @PathVariable UUID documentId,
            Authentication authentication) {
        documentService.deleteDocument(documentId, authentication);
        return ApiResponse.success("Document deleted successfully", null);
    }

    @GetMapping("/{documentId}/download")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'documents:read')")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable UUID documentId,
            Authentication authentication) {
        Resource resource = documentService.downloadDocument(documentId, authentication);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + resource.getFilename() + "\"")
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .body(resource);
    }
}
