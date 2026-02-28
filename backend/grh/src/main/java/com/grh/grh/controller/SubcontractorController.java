package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.request.subcontractor.*;
import com.grh.grh.dto.response.subcontractor.*;
import com.grh.grh.service.SubcontractorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subcontractors")
@RequiredArgsConstructor
public class SubcontractorController {

    private final SubcontractorService subcontractorService;

    // ─── Subcontractor CRUD ───────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'subcontractor:create')")
    public ApiResponse<SubcontractorResponse> create(
        @Valid @RequestBody CreateSubcontractorRequest request,
        Authentication authentication
    ) {
        return ApiResponse.success("Subcontractor created",
            subcontractorService.create(request, authentication));
    }

    @GetMapping("/my-company")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'subcontractor:read')")
    public ApiResponse<List<SubcontractorResponse>> getMyCompanySubcontractors(
        @RequestParam(required = false) UUID companyId,
        Authentication authentication
    ) {
        return ApiResponse.success("Subcontractors retrieved",
            subcontractorService.getMyCompanySubcontractors(companyId, authentication));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'subcontractor:read')")
    public ApiResponse<SubcontractorResponse> getById(
        @PathVariable UUID id, Authentication authentication
    ) {
        return ApiResponse.success("Subcontractor retrieved",
            subcontractorService.getById(id, authentication));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'subcontractor:update')")
    public ApiResponse<SubcontractorResponse> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateSubcontractorRequest request,
        Authentication authentication
    ) {
        return ApiResponse.success("Subcontractor updated",
            subcontractorService.update(id, request, authentication));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'subcontractor:delete')")
    public ApiResponse<Void> delete(
        @PathVariable UUID id, Authentication authentication
    ) {
        subcontractorService.delete(id, authentication);
        return ApiResponse.success("Subcontractor deleted", null);
    }

    // ─── Contracts ────────────────────────────────────────────────────────────

    @PostMapping(value = "/{subcontractorId}/contracts", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'subcontractor:create')")
    public ApiResponse<ContractResponse> createContract(
        @PathVariable UUID subcontractorId,
        @Valid @ModelAttribute CreateContractRequest request,
        @RequestPart("contractDocument") MultipartFile contractDocument,
        Authentication authentication
    ) {
        return ApiResponse.success("Contract created",
            subcontractorService.createContract(subcontractorId, request, contractDocument, authentication));
    }

    @GetMapping("/{subcontractorId}/contracts")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'subcontractor:read')")
    public ApiResponse<List<ContractResponse>> getContracts(
        @PathVariable UUID subcontractorId, Authentication authentication
    ) {
        return ApiResponse.success("Contracts retrieved",
            subcontractorService.getContractsBySubcontractor(subcontractorId, authentication));
    }

    @GetMapping("/{subcontractorId}/contracts/active")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'subcontractor:read')")
    public ApiResponse<ContractResponse> getActiveContract(
        @PathVariable UUID subcontractorId, Authentication authentication
    ) {
        return ApiResponse.success("Active contract retrieved",
            subcontractorService.getActiveContract(subcontractorId, authentication));
    }

    @PostMapping(value = "/contracts/{contractId}/renew", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'subcontractor:update')")
    public ApiResponse<ContractResponse> renewContract(
        @PathVariable UUID contractId,
        @Valid @ModelAttribute CreateContractRequest request,
        @RequestPart("contractDocument") MultipartFile contractDocument,
        Authentication authentication
    ) {
        return ApiResponse.success("Contract renewed",
            subcontractorService.renewContract(contractId, request, contractDocument, authentication));
    }

    @PostMapping("/contracts/{contractId}/terminate")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'subcontractor:update')")
    public ApiResponse<ContractResponse> terminateContract(
        @PathVariable UUID contractId, Authentication authentication
    ) {
        return ApiResponse.success("Contract terminated",
            subcontractorService.terminateContract(contractId, authentication));
    }

    // ─── Invoices ─────────────────────────────────────────────────────────────

    @PostMapping(value = "/contracts/{contractId}/invoices", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'subcontractor:create')")
    public ApiResponse<InvoiceResponse> createInvoice(
        @PathVariable UUID contractId,
        @Valid @ModelAttribute CreateInvoiceRequest request,
        @RequestPart(value = "invoiceDocument", required = false) MultipartFile invoiceDocument,
        Authentication authentication
    ) {
        return ApiResponse.success("Invoice created",
            subcontractorService.createInvoice(contractId, request, invoiceDocument, authentication));
    }

    @GetMapping("/contracts/{contractId}/invoices")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'subcontractor:read')")
    public ApiResponse<List<InvoiceResponse>> getInvoices(
        @PathVariable UUID contractId, Authentication authentication
    ) {
        return ApiResponse.success("Invoices retrieved",
            subcontractorService.getInvoicesByContract(contractId, authentication));
    }

    @PostMapping(value = "/invoices/{invoiceId}/mark-paid", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'subcontractor:update')")
    public ApiResponse<InvoiceResponse> markInvoicePaid(
        @PathVariable UUID invoiceId,
        @RequestPart("paymentProof") MultipartFile paymentProof,
        Authentication authentication
    ) {
        return ApiResponse.success("Invoice marked as paid",
            subcontractorService.markInvoicePaid(invoiceId, paymentProof, authentication));
    }

    // ─── Reviews ──────────────────────────────────────────────────────────────

    @GetMapping("/reviews/my-company")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'subcontractor:read')")
    public ApiResponse<List<SubcontractorReviewResponse>> getMyCompanyReviews(
        @RequestParam(required = false) UUID companyId,
        Authentication authentication
    ) {
        return ApiResponse.success("Reviews retrieved",
            subcontractorService.getMyCompanyReviews(companyId, authentication));
    }

    @GetMapping("/{subcontractorId}/reviews")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'subcontractor:read')")
    public ApiResponse<List<SubcontractorReviewResponse>> getReviewsBySubcontractor(
        @PathVariable UUID subcontractorId, Authentication authentication
    ) {
        return ApiResponse.success("Reviews retrieved",
            subcontractorService.getReviewsBySubcontractor(subcontractorId, authentication));
    }

    @GetMapping("/reviews/{reviewId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'subcontractor:read')")
    public ApiResponse<SubcontractorReviewResponse> getReviewById(
        @PathVariable UUID reviewId, Authentication authentication
    ) {
        return ApiResponse.success("Review retrieved",
            subcontractorService.getReviewById(reviewId, authentication));
    }

    @PutMapping("/reviews/{reviewId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'subcontractor:update')")
    public ApiResponse<SubcontractorReviewResponse> updateReview(
        @PathVariable UUID reviewId,
        @Valid @RequestBody UpdateReviewRequest request,
        Authentication authentication
    ) {
        return ApiResponse.success("Review updated",
            subcontractorService.updateReview(reviewId, request, authentication));
    }

    @PostMapping("/reviews/{reviewId}/submit")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @keycloakUserService.hasPermission(authentication, 'subcontractor:update')")
    public ApiResponse<SubcontractorReviewResponse> submitReview(
        @PathVariable UUID reviewId, Authentication authentication
    ) {
        return ApiResponse.success("Review submitted",
            subcontractorService.submitReview(reviewId, authentication));
    }
}