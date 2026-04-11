package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.subcontractor.*;
import com.grh.grh.dto.response.subcontractor.*;
import com.grh.grh.service.SubcontractorPortalService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subcontractors/portal")
@RequiredArgsConstructor
public class SubcontractorPortalController {

    private final SubcontractorPortalService portalService;
    private static final String PORTAL_SESSION_HEADER = "X-Portal-Session";

    @PostMapping("/public/request-access")
    public ApiResponse<Void> requestAccess(
        @Valid @RequestBody PortalRequestAccessRequest request,
        HttpServletRequest httpRequest
    ) {
        portalService.requestAccess(request, extractClientIp(httpRequest), httpRequest.getHeader("User-Agent"));
        return ApiResponse.success("If your details are valid, an access link has been sent to your email.", null);
    }

    @PostMapping("/public/session")
    public ApiResponse<PortalSessionResponse> createSession(
        @Valid @RequestBody PortalSessionExchangeRequest request,
        HttpServletRequest httpRequest
    ) {
        PortalSessionResponse response = portalService.createSessionFromLoginToken(
            request.getToken(),
            extractClientIp(httpRequest),
            httpRequest.getHeader("User-Agent")
        );
        return ApiResponse.success("Portal session created", response);
    }

    @GetMapping("/me")
    public ApiResponse<PortalProfileResponse> getMyProfile(
        @RequestHeader(PORTAL_SESSION_HEADER) String sessionToken
    ) {
        return ApiResponse.success("Profile retrieved", portalService.getMyProfile(sessionToken));
    }

    @PutMapping("/me/contact-info")
    public ApiResponse<PortalProfileResponse> updateMyContactInfo(
        @RequestHeader(PORTAL_SESSION_HEADER) String sessionToken,
        @Valid @RequestBody PortalContactUpdateRequest request
    ) {
        return ApiResponse.success("Contact info updated", portalService.updateMyContactInfo(sessionToken, request));
    }

    @GetMapping("/me/contracts")
    public ApiResponse<List<PortalContractResponse>> getMyContracts(
        @RequestHeader(PORTAL_SESSION_HEADER) String sessionToken
    ) {
        return ApiResponse.success("Contracts retrieved", portalService.getMyContracts(sessionToken));
    }

    @GetMapping("/me/invoices")
    public ApiResponse<List<PortalInvoiceResponse>> getMyInvoices(
        @RequestHeader(PORTAL_SESSION_HEADER) String sessionToken
    ) {
        return ApiResponse.success("Invoices retrieved", portalService.getMyInvoices(sessionToken));
    }

    @PostMapping(value = "/me/contracts/{contractId}/invoices", consumes = "multipart/form-data")
    public ApiResponse<PortalInvoiceResponse> createInvoice(
        @RequestHeader(PORTAL_SESSION_HEADER) String sessionToken,
        @PathVariable UUID contractId,
        @Valid @ModelAttribute PortalCreateInvoiceRequest request,
        @RequestPart(value = "invoiceDocument", required = false) MultipartFile invoiceDocument
    ) {
        return ApiResponse.success(
            "Invoice submitted",
            portalService.createInvoice(sessionToken, contractId, request, invoiceDocument)
        );
    }

    @PostMapping(value = "/me/invoices/{invoiceId}/payment-proof", consumes = "multipart/form-data")
    public ApiResponse<PortalInvoiceResponse> uploadPaymentProof(
        @RequestHeader(PORTAL_SESSION_HEADER) String sessionToken,
        @PathVariable UUID invoiceId,
        @RequestPart("paymentProof") MultipartFile paymentProof
    ) {
        return ApiResponse.success(
            "Payment proof uploaded",
            portalService.uploadPaymentProof(sessionToken, invoiceId, paymentProof)
        );
    }

    @PostMapping("/me/logout")
    public ApiResponse<Void> logout(@RequestHeader(PORTAL_SESSION_HEADER) String sessionToken) {
        portalService.logout(sessionToken);
        return ApiResponse.success("Portal session closed", null);
    }

    @GetMapping("/files/contracts/{contractId}")
    public ResponseEntity<Resource> downloadContract(
        @RequestHeader(PORTAL_SESSION_HEADER) String sessionToken,
        @PathVariable UUID contractId
    ) {
        Resource resource = portalService.getContractDocument(sessionToken, contractId);
        return buildDownloadResponse(resource, "contract-" + contractId);
    }

    @GetMapping("/files/invoices/{invoiceId}/invoice-document")
    public ResponseEntity<Resource> downloadInvoiceDocument(
        @RequestHeader(PORTAL_SESSION_HEADER) String sessionToken,
        @PathVariable UUID invoiceId
    ) {
        Resource resource = portalService.getInvoiceDocument(sessionToken, invoiceId);
        return buildDownloadResponse(resource, "invoice-" + invoiceId);
    }

    @GetMapping("/files/invoices/{invoiceId}/payment-proof")
    public ResponseEntity<Resource> downloadPaymentProof(
        @RequestHeader(PORTAL_SESSION_HEADER) String sessionToken,
        @PathVariable UUID invoiceId
    ) {
        Resource resource = portalService.getPaymentProof(sessionToken, invoiceId);
        return buildDownloadResponse(resource, "payment-proof-" + invoiceId);
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }

    private ResponseEntity<Resource> buildDownloadResponse(Resource resource, String fallbackName) {
        String filename = resource.getFilename() != null ? resource.getFilename() : fallbackName;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        return ResponseEntity.ok().headers(headers).body(resource);
    }
}
