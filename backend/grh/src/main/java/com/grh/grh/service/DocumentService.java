package com.grh.grh.service;

import com.grh.grh.dto.request.document.UpdateDocumentRequest;
import com.grh.grh.dto.request.document.UploadDocumentRequest;
import com.grh.grh.dto.response.document.DocumentResponse;
import com.grh.grh.entity.Company;
import com.grh.grh.entity.Employee;
import com.grh.grh.entity.EmployeeDocument;
import com.grh.grh.entity.User;
import com.grh.grh.repository.CompanyRepository;
import com.grh.grh.repository.EmployeeDocumentRepository;
import com.grh.grh.repository.EmployeeRepository;
import com.grh.grh.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final EmployeeDocumentRepository documentRepository;
    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final KeycloakUserService keycloakUserService;

    @Transactional
    public DocumentResponse uploadDocument(MultipartFile file,
                                           UploadDocumentRequest request,
                                           Authentication authentication) {
        UUID companyId = resolveCompanyId(authentication, request.getCompanyId());

        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new IllegalArgumentException("Company not found"));

        Employee employee = employeeRepository.findById(request.getEmployeeId())
            .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        String relativePath = fileStorageService.storeFile(file, "documents/" + companyId);

        User uploader = null;
        UUID uploaderId = keycloakUserService.getCurrentUserId(authentication);
        if (uploaderId != null) {
            uploader = userRepository.findById(uploaderId).orElse(null);
        }

        EmployeeDocument document = EmployeeDocument.builder()
            .employee(employee)
            .company(company)
            .documentType(request.getDocumentType())
            .documentName(request.getDocumentName())
            .documentPath(relativePath)
            .documentSize(file.getSize())
            .mimeType(file.getContentType())
            .uploadedBy(uploader)
            .build();

        document = documentRepository.save(document);
        log.info("Uploaded document: {} for employee: {}", document.getId(), employee.getEmployeeId());
        return mapToResponse(document);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentsByEmployee(UUID employeeId, Authentication authentication) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        validateCompanyAccess(employee.getCompany().getId(), authentication);
        return documentRepository.findByEmployeeEmployeeId(employeeId)
            .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DocumentResponse getDocumentById(UUID documentId, Authentication authentication) {
        EmployeeDocument document = documentRepository.findById(documentId)
            .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        validateCompanyAccess(document.getCompany().getId(), authentication);
        return mapToResponse(document);
    }

    @Transactional
    public DocumentResponse updateDocument(UUID documentId, UpdateDocumentRequest request,
                                            Authentication authentication) {
        EmployeeDocument document = documentRepository.findById(documentId)
            .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        validateCompanyAccess(document.getCompany().getId(), authentication);

        if (request.getDocumentType() != null) document.setDocumentType(request.getDocumentType());
        if (request.getDocumentName() != null) document.setDocumentName(request.getDocumentName());

        document = documentRepository.save(document);
        log.info("Updated document: {}", documentId);
        return mapToResponse(document);
    }

    @Transactional
    public void deleteDocument(UUID documentId, Authentication authentication) {
        EmployeeDocument document = documentRepository.findById(documentId)
            .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        validateCompanyAccess(document.getCompany().getId(), authentication);

        fileStorageService.deleteFile(document.getDocumentPath());
        documentRepository.delete(document);
        log.info("Deleted document: {}", documentId);
    }

    @Transactional(readOnly = true)
    public Resource downloadDocument(UUID documentId, Authentication authentication) {
        EmployeeDocument document = documentRepository.findById(documentId)
            .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        validateCompanyAccess(document.getCompany().getId(), authentication);

        try {
            Path filePath = fileStorageService.getFilePath(document.getDocumentPath());
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) {
                throw new RuntimeException("File not found: " + document.getDocumentPath());
            }
            return resource;
        } catch (IOException e) {
            throw new RuntimeException("Could not read file", e);
        }
    }

    private UUID resolveCompanyId(Authentication authentication, UUID requestCompanyId) {
        UUID companyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (companyId != null) return companyId;
        if (keycloakUserService.isSuperAdmin(authentication) && requestCompanyId != null) {
            return requestCompanyId;
        }
        throw new IllegalStateException("User is not associated with any company");
    }

    private void validateCompanyAccess(UUID companyId, Authentication authentication) {
        if (keycloakUserService.isSuperAdmin(authentication)) return;
        UUID userCompanyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (userCompanyId == null || !userCompanyId.equals(companyId)) {
            throw new SecurityException("Access denied");
        }
    }

    private DocumentResponse mapToResponse(EmployeeDocument doc) {
        return DocumentResponse.builder()
            .id(doc.getId())
            .employeeId(doc.getEmployee() != null ? doc.getEmployee().getEmployeeId() : null)
            .employeeName(doc.getEmployee() != null ?
                doc.getEmployee().getFirstName() + " " + doc.getEmployee().getLastName() : null)
            .documentType(doc.getDocumentType())
            .documentName(doc.getDocumentName())
            .filePath(doc.getDocumentPath())
            .fileSize(doc.getDocumentSize())
            .mimeType(doc.getMimeType())
            .companyId(doc.getCompany() != null ? doc.getCompany().getId() : null)
            .companyName(doc.getCompany() != null ? doc.getCompany().getName() : null)
            .uploadedAt(doc.getUploadedAt())
            .build();
    }
}
