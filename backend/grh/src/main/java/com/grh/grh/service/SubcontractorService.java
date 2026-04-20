package com.grh.grh.service;

import com.grh.grh.dto.request.subcontractor.*;
import com.grh.grh.dto.response.subcontractor.*;
import com.grh.grh.entity.*;
import com.grh.grh.event.ActivityLogEvent;
import com.grh.grh.event.NotificationEvent;
import com.grh.grh.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubcontractorService {

    private final SubcontractorRepository subcontractorRepository;
    private final SubcontractorContractRepository contractRepository;
    private final SubcontractorInvoiceRepository invoiceRepository;
    private final SubcontractorReviewRepository reviewRepository;
    private final CompanyRepository companyRepository;
    private final FileStorageService fileStorageService;
    private final KeycloakUserService keycloakUserService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public SubcontractorResponse create(CreateSubcontractorRequest request, Authentication auth) {
        UUID companyId = resolveCompanyId(auth, request.getCompanyId());
        validateCompanyAccess(companyId, auth);

        String type = request.getType() != null ? request.getType().toUpperCase() : "INDIVIDUAL";
        if (!type.equals("INDIVIDUAL") && !type.equals("COMPANY")) {
            throw new IllegalArgumentException("Type must be INDIVIDUAL or COMPANY");
        }
        if (type.equals("COMPANY") && (request.getCompanyName() == null || request.getCompanyName().isBlank())) {
            throw new IllegalArgumentException("Company name is required for COMPANY type");
        }
        if (type.equals("INDIVIDUAL") &&
            (request.getContactFirstName() == null || request.getContactLastName() == null)) {
            throw new IllegalArgumentException("Contact first and last name required for INDIVIDUAL type");
        }
        if (request.getContactEmail() != null &&
            subcontractorRepository.existsByContactEmailAndCompanyId(request.getContactEmail(), companyId)) {
            throw new IllegalStateException("A subcontractor with this email already exists");
        }

        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new IllegalArgumentException("Company not found"));

        Subcontractor sub = Subcontractor.builder()
            .company(company)
            .type(type)
            .companyName(request.getCompanyName())
            .contactFirstName(request.getContactFirstName())
            .contactLastName(request.getContactLastName())
            .contactEmail(request.getContactEmail())
            .contactPhone(request.getContactPhone())
            .address(request.getAddress())
            .city(request.getCity())
            .specialization(request.getSpecialization())
            .status("ACTIVE")
            .build();

        sub = subcontractorRepository.save(sub);

        UUID currentUserId = keycloakUserService.getCurrentUserId(auth);
        String subName = resolveDisplayName(sub);

        // Publish notification event
        eventPublisher.publishEvent(NotificationEvent.builder()
            .companyId(company.getId())
            .type("SYSTEM")
            .title("New Subcontractor Added")
            .message(subName + " has been added as a new subcontractor (" + type + ")")
            .targetModule("SUBCONTRACTOR")
            .targetId(sub.getId())
            .importance("MEDIUM")
            .build());

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(company.getId())
            .userId(currentUserId)
            .action("SUBCONTRACTOR_CREATED")
            .entityType("SUBCONTRACTOR")
            .entityId(sub.getId())
            .build());

        log.info("Created subcontractor: {} type={}", resolveDisplayName(sub), type);
        return mapToResponse(sub);
    }

    @Transactional
    public SubcontractorResponse update(UUID id, UpdateSubcontractorRequest request, Authentication auth) {
        Subcontractor sub = subcontractorRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Subcontractor not found"));
        validateCompanyAccess(sub.getCompany().getId(), auth);

        if ("TERMINATED".equalsIgnoreCase(sub.getStatus())) {
            throw new IllegalStateException("Cannot update a terminated subcontractor");
        }

        if (request.getCompanyName() != null)     sub.setCompanyName(request.getCompanyName());
        if (request.getContactFirstName() != null) sub.setContactFirstName(request.getContactFirstName());
        if (request.getContactLastName() != null)  sub.setContactLastName(request.getContactLastName());
        if (request.getContactEmail() != null)     sub.setContactEmail(request.getContactEmail());
        if (request.getContactPhone() != null)     sub.setContactPhone(request.getContactPhone());
        if (request.getAddress() != null)          sub.setAddress(request.getAddress());
        if (request.getCity() != null)             sub.setCity(request.getCity());
        if (request.getSpecialization() != null)   sub.setSpecialization(request.getSpecialization());
        if (request.getStatus() != null) {
            String st = request.getStatus().toUpperCase();
            if (!st.equals("ACTIVE") && !st.equals("INACTIVE")) {
                throw new IllegalArgumentException("Use terminate endpoint to terminate");
            }
            sub.setStatus(st);
        }

        sub = subcontractorRepository.save(sub);

        UUID currentUserId = keycloakUserService.getCurrentUserId(auth);

        // Publish notification event
        eventPublisher.publishEvent(NotificationEvent.builder()
            .companyId(sub.getCompany().getId())
            .type("SYSTEM")
            .title("Subcontractor Updated")
            .message("Subcontractor " + resolveDisplayName(sub) + " has been updated")
            .targetModule("SUBCONTRACTOR")
            .targetId(sub.getId())
            .importance("LOW")
            .build());

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(sub.getCompany().getId())
            .userId(currentUserId)
            .action("SUBCONTRACTOR_UPDATED")
            .entityType("SUBCONTRACTOR")
            .entityId(sub.getId())
            .build());

        log.info("Updated subcontractor: {}", id);
        return mapToResponse(sub);
    }

    @Transactional
    public SubcontractorResponse terminate(UUID id, Authentication auth) {
        Subcontractor sub = subcontractorRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Subcontractor not found"));
        validateCompanyAccess(sub.getCompany().getId(), auth);

        if ("TERMINATED".equalsIgnoreCase(sub.getStatus())) {
            throw new IllegalStateException("Already terminated");
        }

        sub.setStatus("TERMINATED");
        sub = subcontractorRepository.save(sub);

        UUID currentUserId = keycloakUserService.getCurrentUserId(auth);

        // Publish notification event (HIGH importance - termination is significant)
        eventPublisher.publishEvent(NotificationEvent.builder()
            .companyId(sub.getCompany().getId())
            .type("SYSTEM")
            .title("Subcontractor Terminated")
            .message("Subcontractor " + resolveDisplayName(sub) + " has been terminated")
            .targetModule("SUBCONTRACTOR")
            .targetId(sub.getId())
            .importance("HIGH")
            .build());

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(sub.getCompany().getId())
            .userId(currentUserId)
            .action("SUBCONTRACTOR_TERMINATED")
            .entityType("SUBCONTRACTOR")
            .entityId(sub.getId())
            .build());

        log.info("Terminated subcontractor: {} — data preserved", id);
        return mapToResponse(sub);
    }

    @Transactional(readOnly = true)
    public SubcontractorResponse getById(UUID id, Authentication auth) {
        Subcontractor sub = subcontractorRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Subcontractor not found"));
        validateCompanyAccess(sub.getCompany().getId(), auth);
        return mapToResponse(sub);
    }

    @Transactional(readOnly = true)
    public List<SubcontractorResponse> getByCompany(UUID companyId, Authentication auth) {
        validateCompanyAccess(companyId, auth);
        return subcontractorRepository.findByCompanyId(companyId).stream()
            .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SubcontractorResponse> getActiveByCompany(UUID companyId, Authentication auth) {
        validateCompanyAccess(companyId, auth);
        return subcontractorRepository.findByCompanyIdAndStatus(companyId, "ACTIVE").stream()
            .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void delete(UUID id, Authentication auth) {
        terminate(id, auth);
    }

    @Transactional(readOnly = true)
    public List<SubcontractorResponse> getMyCompanySubcontractors(UUID companyId, Authentication auth) {
        UUID cid = companyId != null ? companyId : resolveCompanyId(auth, null);
        validateCompanyAccess(cid, auth);
        return subcontractorRepository.findByCompanyId(cid).stream()
            .map(this::mapToResponse).collect(Collectors.toList());
    }

    // ─── Contract Management ──────────────────────────────────────────────────

    @Transactional
    public ContractResponse createContract(UUID subcontractorId, CreateContractRequest request,
                                           MultipartFile contractDocument, Authentication auth) {
        Subcontractor sub = subcontractorRepository.findById(subcontractorId)
            .orElseThrow(() -> new IllegalArgumentException("Subcontractor not found"));
        validateCompanyAccess(sub.getCompany().getId(), auth);

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        contractRepository.findBySubcontractorIdAndStatus(subcontractorId, "ACTIVE")
            .ifPresent(c -> { throw new IllegalStateException("An active contract already exists"); });

        String docPath = fileStorageService.storeFile(contractDocument, "contracts");

        SubcontractorContract contract = SubcontractorContract.builder()
            .subcontractor(sub)
            .company(sub.getCompany())
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .paymentType(request.getPaymentType())
            .amount(request.getAmount())
            .status("ACTIVE")
            .contractDocumentPath(docPath)
            .notes(request.getNotes())
            .build();

        contract = contractRepository.save(contract);

        UUID currentUserId = keycloakUserService.getCurrentUserId(auth);

        // Publish notification event
        eventPublisher.publishEvent(NotificationEvent.builder()
            .companyId(sub.getCompany().getId())
            .type("SYSTEM")
            .title("New Contract Created")
            .message("A contract has been created for " + resolveDisplayName(sub))
            .targetModule("SUBCONTRACTOR")
            .targetId(contract.getId())
            .importance("MEDIUM")
            .build());

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(sub.getCompany().getId())
            .userId(currentUserId)
            .action("SUBCONTRACTOR_CONTRACT_CREATED")
            .entityType("SUBCONTRACTOR_CONTRACT")
            .entityId(contract.getId())
            .build());

        log.info("Created contract for subcontractor {}", subcontractorId);
        return mapContractToResponse(contract);
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> getContractsBySubcontractor(UUID subcontractorId, Authentication auth) {
        Subcontractor sub = subcontractorRepository.findById(subcontractorId)
            .orElseThrow(() -> new IllegalArgumentException("Subcontractor not found"));
        validateCompanyAccess(sub.getCompany().getId(), auth);
        return contractRepository.findBySubcontractorId(subcontractorId).stream()
            .map(this::mapContractToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ContractResponse getActiveContract(UUID subcontractorId, Authentication auth) {
        Subcontractor sub = subcontractorRepository.findById(subcontractorId)
            .orElseThrow(() -> new IllegalArgumentException("Subcontractor not found"));
        validateCompanyAccess(sub.getCompany().getId(), auth);
        SubcontractorContract contract = contractRepository.findBySubcontractorIdAndStatus(subcontractorId, "ACTIVE")
            .orElseThrow(() -> new IllegalArgumentException("No active contract found"));
        return mapContractToResponse(contract);
    }

    @Transactional
    public ContractResponse renewContract(UUID contractId, CreateContractRequest request,
                                          MultipartFile contractDocument, Authentication auth) {
        SubcontractorContract old = contractRepository.findById(contractId)
            .orElseThrow(() -> new IllegalArgumentException("Contract not found"));
        validateCompanyAccess(old.getCompany().getId(), auth);

        old.setStatus("RENEWED");
        contractRepository.save(old);

        String docPath = fileStorageService.storeFile(contractDocument, "contracts");

        SubcontractorContract renewed = SubcontractorContract.builder()
            .subcontractor(old.getSubcontractor())
            .company(old.getCompany())
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .paymentType(request.getPaymentType())
            .amount(request.getAmount())
            .status("ACTIVE")
            .contractDocumentPath(docPath)
            .notes(request.getNotes())
            .build();

        renewed = contractRepository.save(renewed);

        UUID currentUserId = keycloakUserService.getCurrentUserId(auth);

        // Publish notification event
        eventPublisher.publishEvent(NotificationEvent.builder()
            .companyId(old.getCompany().getId())
            .type("SYSTEM")
            .title("Contract Renewed")
            .message("A contract has been renewed for " + resolveDisplayName(old.getSubcontractor()))
            .targetModule("SUBCONTRACTOR")
            .targetId(renewed.getId())
            .importance("MEDIUM")
            .build());

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(old.getCompany().getId())
            .userId(currentUserId)
            .action("SUBCONTRACTOR_CONTRACT_RENEWED")
            .entityType("SUBCONTRACTOR_CONTRACT")
            .entityId(renewed.getId())
            .build());

        log.info("Renewed contract {} → new contract {}", contractId, renewed.getId());
        return mapContractToResponse(renewed);
    }

    @Transactional
    public ContractResponse terminateContract(UUID contractId, Authentication auth) {
        SubcontractorContract contract = contractRepository.findById(contractId)
            .orElseThrow(() -> new IllegalArgumentException("Contract not found"));
        validateCompanyAccess(contract.getCompany().getId(), auth);
        contract.setStatus("TERMINATED");
        contract = contractRepository.save(contract);

        UUID currentUserId = keycloakUserService.getCurrentUserId(auth);

        // Publish notification event
        eventPublisher.publishEvent(NotificationEvent.builder()
            .companyId(contract.getCompany().getId())
            .type("SYSTEM")
            .title("Contract Terminated")
            .message("A contract has been terminated")
            .targetModule("SUBCONTRACTOR")
            .targetId(contract.getId())
            .importance("HIGH")
            .build());

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(contract.getCompany().getId())
            .userId(currentUserId)
            .action("SUBCONTRACTOR_CONTRACT_TERMINATED")
            .entityType("SUBCONTRACTOR_CONTRACT")
            .entityId(contract.getId())
            .build());

        log.info("Terminated contract {}", contractId);
        return mapContractToResponse(contract);
    }

    // ─── Invoice Management ──────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse createInvoice(UUID contractId, CreateInvoiceRequest request,
                                         MultipartFile invoiceDocument, Authentication auth) {
        SubcontractorContract contract = contractRepository.findById(contractId)
            .orElseThrow(() -> new IllegalArgumentException("Contract not found"));
        validateCompanyAccess(contract.getCompany().getId(), auth);

        String docPath = null;
        if (invoiceDocument != null && !invoiceDocument.isEmpty()) {
            docPath = fileStorageService.storeFile(invoiceDocument, "invoices");
        }

        SubcontractorInvoice invoice = SubcontractorInvoice.builder()
            .contract(contract)
            .subcontractor(contract.getSubcontractor())
            .company(contract.getCompany())
            .invoiceNumber(request.getInvoiceNumber())
            .amount(request.getAmount())
            .dueDate(request.getDueDate())
            .status("PENDING")
            .invoiceDocumentPath(docPath)
            .notes(request.getNotes())
            .build();

        invoice = invoiceRepository.save(invoice);

        UUID currentUserId = keycloakUserService.getCurrentUserId(auth);

        // Publish notification event (invoices are important for HR to track payments)
        eventPublisher.publishEvent(NotificationEvent.builder()
            .companyId(contract.getCompany().getId())
            .type("SYSTEM")
            .title("New Invoice Created")
            .message("Invoice " + request.getInvoiceNumber() + " for " + invoice.getAmount() + " has been created for " +
                resolveDisplayName(contract.getSubcontractor()))
            .targetModule("SUBCONTRACTOR")
            .targetId(invoice.getId())
            .importance("MEDIUM")
            .build());

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(contract.getCompany().getId())
            .userId(currentUserId)
            .action("SUBCONTRACTOR_INVOICE_CREATED")
            .entityType("SUBCONTRACTOR_INVOICE")
            .entityId(invoice.getId())
            .build());

        log.info("Created invoice {} for contract {}", invoice.getInvoiceNumber(), contractId);
        return mapInvoiceToResponse(invoice);
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoicesByContract(UUID contractId, Authentication auth) {
        SubcontractorContract contract = contractRepository.findById(contractId)
            .orElseThrow(() -> new IllegalArgumentException("Contract not found"));
        validateCompanyAccess(contract.getCompany().getId(), auth);
        return invoiceRepository.findByContractId(contractId).stream()
            .map(this::mapInvoiceToResponse).collect(Collectors.toList());
    }

    @Transactional
    public InvoiceResponse markInvoicePaid(UUID invoiceId, MultipartFile paymentProof, Authentication auth) {
        SubcontractorInvoice invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        validateCompanyAccess(invoice.getCompany().getId(), auth);

        if ("PAID".equals(invoice.getStatus())) {
            throw new IllegalStateException("Invoice is already paid");
        }

        String proofPath = fileStorageService.storeFile(paymentProof, "payment-proofs");
        invoice.setStatus("PAID");
        invoice.setPaidDate(LocalDate.now());
        invoice.setPaymentProofPath(proofPath);
        invoice = invoiceRepository.save(invoice);

        UUID currentUserId = keycloakUserService.getCurrentUserId(auth);

        // Publish notification event
        eventPublisher.publishEvent(NotificationEvent.builder()
            .companyId(invoice.getCompany().getId())
            .type("SYSTEM")
            .title("Invoice Marked as Paid")
            .message("Invoice " + invoice.getInvoiceNumber() + " has been marked as paid")
            .targetModule("SUBCONTRACTOR")
            .targetId(invoice.getId())
            .importance("MEDIUM")
            .build());

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(invoice.getCompany().getId())
            .userId(currentUserId)
            .action("SUBCONTRACTOR_INVOICE_PAID")
            .entityType("SUBCONTRACTOR_INVOICE")
            .entityId(invoice.getId())
            .build());

        log.info("Marked invoice {} as paid", invoiceId);
        return mapInvoiceToResponse(invoice);
    }

    // ─── Review Management ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SubcontractorReviewResponse> getMyCompanyReviews(UUID companyId, Authentication auth) {
        UUID cid = companyId != null ? companyId : resolveCompanyId(auth, null);
        validateCompanyAccess(cid, auth);
        return reviewRepository.findByCompanyId(cid).stream()
            .map(this::mapReviewToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SubcontractorReviewResponse> getReviewsBySubcontractor(UUID subcontractorId, Authentication auth) {
        Subcontractor sub = subcontractorRepository.findById(subcontractorId)
            .orElseThrow(() -> new IllegalArgumentException("Subcontractor not found"));
        validateCompanyAccess(sub.getCompany().getId(), auth);
        return reviewRepository.findBySubcontractorId(subcontractorId).stream()
            .map(this::mapReviewToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubcontractorReviewResponse getReviewById(UUID reviewId, Authentication auth) {
        SubcontractorReview review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new IllegalArgumentException("Review not found"));
        validateCompanyAccess(review.getCompany().getId(), auth);
        return mapReviewToResponse(review);
    }

    @Transactional
    public SubcontractorReviewResponse updateReview(UUID reviewId, UpdateReviewRequest request, Authentication auth) {
        SubcontractorReview review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new IllegalArgumentException("Review not found"));
        validateCompanyAccess(review.getCompany().getId(), auth);

        if ("SUBMITTED".equals(review.getStatus())) {
            throw new IllegalStateException("Cannot update a submitted review");
        }

        if (request.getQualityOfWork() != null) review.setQualityOfWork(request.getQualityOfWork());
        if (request.getTimelinessReliability() != null) review.setTimelinessReliability(request.getTimelinessReliability());
        if (request.getCommunication() != null) review.setCommunication(request.getCommunication());
        if (request.getComplianceDocumentation() != null) review.setComplianceDocumentation(request.getComplianceDocumentation());
        if (request.getProfessionalismConduct() != null) review.setProfessionalismConduct(request.getProfessionalismConduct());
        if (request.getCostManagement() != null) review.setCostManagement(request.getCostManagement());
        if (request.getHealthSafetySecurity() != null) review.setHealthSafetySecurity(request.getHealthSafetySecurity());
        if (request.getFlexibilityProblemSolving() != null) review.setFlexibilityProblemSolving(request.getFlexibilityProblemSolving());
        if (request.getCollaborationTeamwork() != null) review.setCollaborationTeamwork(request.getCollaborationTeamwork());
        if (request.getInnovationValueAdded() != null) review.setInnovationValueAdded(request.getInnovationValueAdded());
        if (request.getHrNotes() != null) review.setHrNotes(request.getHrNotes());

        review.setOverallScore(calculateOverallScore(review));
        review = reviewRepository.save(review);
        log.info("Updated review {}", reviewId);
        return mapReviewToResponse(review);
    }

    @Transactional
    public SubcontractorReviewResponse submitReview(UUID reviewId, Authentication auth) {
        SubcontractorReview review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new IllegalArgumentException("Review not found"));
        validateCompanyAccess(review.getCompany().getId(), auth);

        if ("SUBMITTED".equals(review.getStatus())) {
            throw new IllegalStateException("Review already submitted");
        }

        review.setStatus("SUBMITTED");
        review.setOverallScore(calculateOverallScore(review));
        review = reviewRepository.save(review);

        UUID currentUserId = keycloakUserService.getCurrentUserId(auth);

        // Publish notification event
        eventPublisher.publishEvent(NotificationEvent.builder()
            .companyId(review.getCompany().getId())
            .type("SYSTEM")
            .title("Subcontractor Review Submitted")
            .message("A performance review has been submitted for " + resolveDisplayName(review.getSubcontractor()))
            .targetModule("SUBCONTRACTOR")
            .targetId(review.getId())
            .importance("MEDIUM")
            .build());

        // Publish activity log event
        eventPublisher.publishEvent(ActivityLogEvent.builder()
            .companyId(review.getCompany().getId())
            .userId(currentUserId)
            .action("SUBCONTRACTOR_REVIEW_SUBMITTED")
            .entityType("SUBCONTRACTOR_REVIEW")
            .entityId(review.getId())
            .build());

        log.info("Submitted review {}", reviewId);
        return mapReviewToResponse(review);
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private UUID resolveCompanyId(Authentication auth, UUID requestCompanyId) {
        if (keycloakUserService.isSuperAdmin(auth)) {
            if (requestCompanyId == null)
                throw new IllegalArgumentException("companyId required for super admin");
            return requestCompanyId;
        }
        UUID cid = keycloakUserService.getCurrentUserCompanyId(auth);
        if (cid == null) throw new IllegalStateException("User has no company");
        return cid;
    }

    private void validateCompanyAccess(UUID companyId, Authentication auth) {
        if (keycloakUserService.isSuperAdmin(auth)) return;
        UUID userCid = keycloakUserService.getCurrentUserCompanyId(auth);
        if (userCid == null || !userCid.equals(companyId))
            throw new SecurityException("Access denied");
    }

    private String resolveDisplayName(Subcontractor s) {
        String companyName = s.getCompanyName() != null ? s.getCompanyName().trim() : "";
        if (!companyName.isEmpty()) {
            return companyName;
        }
        String f = s.getContactFirstName() != null ? s.getContactFirstName().trim() : "";
        String l = s.getContactLastName() != null ? s.getContactLastName().trim() : "";
        return (f + " " + l).trim();
    }

    private SubcontractorResponse mapToResponse(Subcontractor s) {
        return SubcontractorResponse.builder()
            .id(s.getId())
            .companyId(s.getCompany().getId())
            .companyName(s.getCompany().getName())
            .type(s.getType())
            .subcontractorCompanyName(s.getCompanyName())
            .contactFirstName(s.getContactFirstName())
            .contactLastName(s.getContactLastName())
            .displayName(resolveDisplayName(s))
            .contactEmail(s.getContactEmail())
            .contactPhone(s.getContactPhone())
            .address(s.getAddress())
            .city(s.getCity())
            .specialization(s.getSpecialization())
            .status(s.getStatus())
            .createdAt(s.getCreatedAt())
            .updatedAt(s.getUpdatedAt())
            .build();
    }

    private ContractResponse mapContractToResponse(SubcontractorContract c) {
        return ContractResponse.builder()
            .id(c.getId())
            .subcontractorId(c.getSubcontractor().getId())
            .subcontractorDisplayName(resolveDisplayName(c.getSubcontractor()))
            .startDate(c.getStartDate())
            .endDate(c.getEndDate())
            .paymentType(c.getPaymentType())
            .amount(c.getAmount())
            .status(c.getStatus())
            .contractDocumentPath(c.getContractDocumentPath())
            .notes(c.getNotes())
            .createdAt(c.getCreatedAt())
            .updatedAt(c.getUpdatedAt())
            .build();
    }

    private InvoiceResponse mapInvoiceToResponse(SubcontractorInvoice i) {
        return InvoiceResponse.builder()
            .id(i.getId())
            .contractId(i.getContract().getId())
            .subcontractorId(i.getSubcontractor().getId())
            .subcontractorDisplayName(resolveDisplayName(i.getSubcontractor()))
            .invoiceNumber(i.getInvoiceNumber())
            .amount(i.getAmount())
            .dueDate(i.getDueDate())
            .paidDate(i.getPaidDate())
            .status(i.getStatus())
            .invoiceDocumentPath(i.getInvoiceDocumentPath())
            .paymentProofPath(i.getPaymentProofPath())
            .notes(i.getNotes())
            .createdAt(i.getCreatedAt())
            .updatedAt(i.getUpdatedAt())
            .build();
    }

    private SubcontractorReviewResponse mapReviewToResponse(SubcontractorReview r) {
        return SubcontractorReviewResponse.builder()
            .id(r.getId())
            .subcontractorId(r.getSubcontractor().getId())
            .subcontractorDisplayName(resolveDisplayName(r.getSubcontractor()))
            .reviewerId(r.getReviewerId())
            .reviewMonth(r.getReviewMonth())
            .reviewYear(r.getReviewYear())
            .qualityOfWork(r.getQualityOfWork())
            .timelinessReliability(r.getTimelinessReliability())
            .communication(r.getCommunication())
            .complianceDocumentation(r.getComplianceDocumentation())
            .professionalismConduct(r.getProfessionalismConduct())
            .costManagement(r.getCostManagement())
            .healthSafetySecurity(r.getHealthSafetySecurity())
            .flexibilityProblemSolving(r.getFlexibilityProblemSolving())
            .collaborationTeamwork(r.getCollaborationTeamwork())
            .innovationValueAdded(r.getInnovationValueAdded())
            .overallScore(r.getOverallScore())
            .hrNotes(r.getHrNotes())
            .aiNotes(r.getAiNotes())
            .status(r.getStatus())
            .createdAt(r.getCreatedAt())
            .updatedAt(r.getUpdatedAt())
            .build();
    }

    private BigDecimal calculateOverallScore(SubcontractorReview r) {
        int count = 0;
        int sum = 0;
        if (r.getQualityOfWork() != null) { sum += r.getQualityOfWork(); count++; }
        if (r.getTimelinessReliability() != null) { sum += r.getTimelinessReliability(); count++; }
        if (r.getCommunication() != null) { sum += r.getCommunication(); count++; }
        if (r.getComplianceDocumentation() != null) { sum += r.getComplianceDocumentation(); count++; }
        if (r.getProfessionalismConduct() != null) { sum += r.getProfessionalismConduct(); count++; }
        if (r.getCostManagement() != null) { sum += r.getCostManagement(); count++; }
        if (r.getHealthSafetySecurity() != null) { sum += r.getHealthSafetySecurity(); count++; }
        if (r.getFlexibilityProblemSolving() != null) { sum += r.getFlexibilityProblemSolving(); count++; }
        if (r.getCollaborationTeamwork() != null) { sum += r.getCollaborationTeamwork(); count++; }
        if (r.getInnovationValueAdded() != null) { sum += r.getInnovationValueAdded(); count++; }
        if (count == 0) return BigDecimal.ZERO;
        return BigDecimal.valueOf(sum).divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
    }
}