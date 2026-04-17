package com.grh.grh.service;

import com.grh.grh.dto.request.subcontractor.PortalContactUpdateRequest;
import com.grh.grh.dto.request.subcontractor.PortalCreateInvoiceRequest;
import com.grh.grh.dto.request.subcontractor.PortalRequestAccessRequest;
import com.grh.grh.dto.response.subcontractor.*;
import com.grh.grh.entity.*;
import com.grh.grh.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubcontractorPortalService {

    private static final String LOGIN_TOKEN_TYPE = "LOGIN";
    private static final String SESSION_TOKEN_TYPE = "SESSION";
    private static final String ACTIVE_STATUS = "ACTIVE";

    private final SubcontractorRepository subcontractorRepository;
    private final SubcontractorContractRepository contractRepository;
    private final SubcontractorInvoiceRepository invoiceRepository;
    private final SubcontractorPortalTokenRepository portalTokenRepository;
    private final SubcontractorPortalAttemptRepository portalAttemptRepository;
    private final FileStorageService fileStorageService;
    private final EmailService emailService;
    private final TurnstileService turnstileService;

    @Value("${app.frontend.subcontractor-base-url:http://localhost:44491}")
    private String subcontractorPortalBaseUrl;

    @Value("${subcontractor.portal.login-token-minutes:30}")
    private long loginTokenMinutes;

    @Value("${subcontractor.portal.session-hours:12}")
    private long sessionHours;

    @Transactional
    public void requestAccess(PortalRequestAccessRequest request, String ipAddress, String userAgent) {
        turnstileService.verifyToken(request.getTurnstileToken(), ipAddress);

        String normalizedEmail = normalizeEmail(request.getContactEmail());
        Subcontractor subcontractor = subcontractorRepository
            .findFirstByContactEmailIgnoreCaseOrderByCreatedAtDesc(normalizedEmail)
            .orElse(null);

        if (subcontractor == null) {
            logAttempt(null, null, normalizedEmail, ipAddress, userAgent, "REJECTED", "SUBCONTRACTOR_NOT_FOUND");
            throw new IllegalArgumentException("Email is not on record");
        }

        String status = subcontractor.getStatus();
        if (!"ACTIVE".equalsIgnoreCase(status) && !"TERMINATED".equalsIgnoreCase(status)) {
            logAttempt(subcontractor.getCompany(), subcontractor, normalizedEmail, ipAddress, userAgent, "REJECTED", "SUBCONTRACTOR_INACTIVE");
            throw new IllegalArgumentException("This subcontractor account is not active or terminated");
        }

        Company company = subcontractor.getCompany();

        issueAndSendLoginToken(subcontractor, company, ipAddress, userAgent);

        logAttempt(company, subcontractor, normalizedEmail, ipAddress, userAgent, "ACCEPTED", null);
    }

    @Transactional
    public void sendAccessLinkBySubcontractorId(UUID subcontractorId, String ipAddress, String userAgent) {
        Subcontractor subcontractor = subcontractorRepository.findById(subcontractorId)
            .orElseThrow(() -> new IllegalArgumentException("Subcontractor not found"));

        if (!ACTIVE_STATUS.equalsIgnoreCase(subcontractor.getStatus())) {
            throw new IllegalStateException("Cannot send access link to inactive subcontractor");
        }
        if (subcontractor.getContactEmail() == null || subcontractor.getContactEmail().isBlank()) {
            throw new IllegalArgumentException("Subcontractor contact email is required");
        }

        Company company = subcontractor.getCompany();
        issueAndSendLoginToken(subcontractor, company, ipAddress, userAgent);
        logAttempt(company, subcontractor, subcontractor.getContactEmail(), ipAddress, userAgent, "ACCEPTED", "STAFF_TRIGGERED");
    }

    @Transactional
    public PortalSessionResponse createSessionFromLoginToken(String rawLoginToken, String ipAddress, String userAgent) {
        SubcontractorPortalToken loginToken = getTokenByRawValue(rawLoginToken, LOGIN_TOKEN_TYPE);

        if (loginToken.getUsedAt() != null) {
            logAttempt(loginToken.getCompany(), loginToken.getSubcontractor(), loginToken.getSubcontractor().getContactEmail(),
                ipAddress, userAgent, "REJECTED", "LOGIN_TOKEN_ALREADY_USED");
            throw new IllegalArgumentException("This access link has already been used");
        }

        if (isExpired(loginToken)) {
            logAttempt(loginToken.getCompany(), loginToken.getSubcontractor(), loginToken.getSubcontractor().getContactEmail(),
                ipAddress, userAgent, "REJECTED", "LOGIN_TOKEN_EXPIRED");
            throw new IllegalArgumentException("This access link has expired");
        }

        if (isRevoked(loginToken)) {
            logAttempt(loginToken.getCompany(), loginToken.getSubcontractor(), loginToken.getSubcontractor().getContactEmail(),
                ipAddress, userAgent, "REJECTED", "LOGIN_TOKEN_REVOKED");
            throw new IllegalArgumentException("This access link is no longer valid");
        }

        loginToken.setUsedAt(OffsetDateTime.now());
        loginToken.setLastUsedAt(OffsetDateTime.now());
        portalTokenRepository.save(loginToken);

        String sessionTokenRaw = generateRandomToken();
        OffsetDateTime sessionExpiry = OffsetDateTime.now().plusHours(sessionHours);

        SubcontractorPortalToken sessionToken = SubcontractorPortalToken.builder()
            .subcontractor(loginToken.getSubcontractor())
            .company(loginToken.getCompany())
            .tokenHash(hashToken(sessionTokenRaw))
            .tokenType(SESSION_TOKEN_TYPE)
            .expiresAt(sessionExpiry)
            .createdIp(ipAddress)
            .createdUserAgent(userAgent)
            .lastUsedAt(OffsetDateTime.now())
            .build();

        portalTokenRepository.save(sessionToken);

        return PortalSessionResponse.builder()
            .sessionToken(sessionTokenRaw)
            .expiresAt(sessionExpiry)
            .subcontractorId(loginToken.getSubcontractor().getId())
            .subcontractorDisplayName(resolveDisplayName(loginToken.getSubcontractor()))
            .build();
    }

    @Transactional(readOnly = true)
    public PortalProfileResponse getMyProfile(String sessionTokenRaw) {
        SessionContext context = requireValidSession(sessionTokenRaw);
        Subcontractor subcontractor = context.subcontractor();

        return PortalProfileResponse.builder()
            .subcontractorId(subcontractor.getId())
            .companyId(context.company().getId())
            .companyName(context.company().getName())
            .displayName(resolveDisplayName(subcontractor))
            .type(subcontractor.getType())
            .contactEmail(subcontractor.getContactEmail())
            .contactPhone(subcontractor.getContactPhone())
            .address(subcontractor.getAddress())
            .city(subcontractor.getCity())
            .specialization(subcontractor.getSpecialization())
            .status(subcontractor.getStatus())
            .build();
    }

    @Transactional(readOnly = true)
    public List<PortalContractResponse> getMyContracts(String sessionTokenRaw) {
        SessionContext context = requireValidSession(sessionTokenRaw);

        return contractRepository.findBySubcontractorId(context.subcontractor().getId()).stream()
            .map(this::mapContract)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PortalInvoiceResponse> getMyInvoices(String sessionTokenRaw) {
        SessionContext context = requireValidSession(sessionTokenRaw);

        return invoiceRepository.findBySubcontractorId(context.subcontractor().getId()).stream()
            .map(this::mapInvoice)
            .collect(Collectors.toList());
    }

    @Transactional
    public PortalInvoiceResponse createInvoice(
        String sessionTokenRaw,
        UUID contractId,
        PortalCreateInvoiceRequest request,
        MultipartFile invoiceDocument
    ) {
        SessionContext context = requireValidSession(sessionTokenRaw);

        SubcontractorContract contract = contractRepository.findById(contractId)
            .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        if (!contract.getSubcontractor().getId().equals(context.subcontractor().getId())) {
            throw new SecurityException("Access denied");
        }

        if (!"ACTIVE".equalsIgnoreCase(contract.getStatus())) {
            throw new IllegalStateException("Invoice can only be created for active contracts");
        }

        if (invoiceRepository.existsByInvoiceNumberAndCompanyId(request.getInvoiceNumber(), context.company().getId())) {
            throw new IllegalStateException("Invoice number already exists for this company");
        }

        String privateInvoicePath = null;
        if (invoiceDocument != null && !invoiceDocument.isEmpty()) {
            privateInvoicePath = fileStorageService.storePrivateFile(invoiceDocument, "subcontractor-portal/invoices");
        }

        SubcontractorInvoice invoice = SubcontractorInvoice.builder()
            .contract(contract)
            .subcontractor(context.subcontractor())
            .company(context.company())
            .invoiceNumber(request.getInvoiceNumber())
            .amount(request.getAmount())
            .dueDate(request.getDueDate())
            .status("PENDING")
            .invoiceDocumentPath(privateInvoicePath)
            .notes(request.getNotes())
            .build();

        return mapInvoice(invoiceRepository.save(invoice));
    }

    @Transactional
    public PortalInvoiceResponse uploadPaymentProof(String sessionTokenRaw, UUID invoiceId, MultipartFile paymentProof) {
        SessionContext context = requireValidSession(sessionTokenRaw);

        SubcontractorInvoice invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));

        if (!invoice.getSubcontractor().getId().equals(context.subcontractor().getId())) {
            throw new SecurityException("Access denied");
        }

        String privateProofPath = fileStorageService.storePrivateFile(paymentProof, "subcontractor-portal/payment-proofs");
        invoice.setPaymentProofPath(privateProofPath);

        if ("OVERDUE".equalsIgnoreCase(invoice.getStatus())) {
            invoice.setStatus("PENDING");
        }

        return mapInvoice(invoiceRepository.save(invoice));
    }

    @Transactional
    public PortalProfileResponse updateMyContactInfo(String sessionTokenRaw, PortalContactUpdateRequest request) {
        SessionContext context = requireValidSession(sessionTokenRaw);
        Subcontractor subcontractor = context.subcontractor();

        if (request.getContactEmail() != null && !request.getContactEmail().isBlank()) {
            subcontractor.setContactEmail(request.getContactEmail().trim());
        }
        if (request.getContactPhone() != null) {
            subcontractor.setContactPhone(request.getContactPhone());
        }
        if (request.getAddress() != null) {
            subcontractor.setAddress(request.getAddress());
        }
        if (request.getCity() != null) {
            subcontractor.setCity(request.getCity());
        }
        if (request.getSpecialization() != null) {
            subcontractor.setSpecialization(request.getSpecialization());
        }

        subcontractorRepository.save(subcontractor);
        return getMyProfile(sessionTokenRaw);
    }

    @Transactional(readOnly = true)
    public Resource getContractDocument(String sessionTokenRaw, UUID contractId) {
        SessionContext context = requireValidSession(sessionTokenRaw);
        SubcontractorContract contract = contractRepository.findById(contractId)
            .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        if (!contract.getSubcontractor().getId().equals(context.subcontractor().getId())) {
            throw new SecurityException("Access denied");
        }

        String path = contract.getContractDocumentPath();
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("Contract document not found");
        }

        if (isPrivatePath(path)) {
            return fileStorageService.loadPrivateFileAsResource(path);
        }

        return fileStorageService.loadFileAsResource(path);
    }

    @Transactional(readOnly = true)
    public Resource getInvoiceDocument(String sessionTokenRaw, UUID invoiceId) {
        SubcontractorInvoice invoice = getOwnedInvoice(requireValidSession(sessionTokenRaw), invoiceId);
        String path = invoice.getInvoiceDocumentPath();
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("Invoice document not found");
        }
        if (!isPrivatePath(path)) {
            return fileStorageService.loadFileAsResource(path);
        }
        return fileStorageService.loadPrivateFileAsResource(path);
    }

    @Transactional(readOnly = true)
    public Resource getPaymentProof(String sessionTokenRaw, UUID invoiceId) {
        SubcontractorInvoice invoice = getOwnedInvoice(requireValidSession(sessionTokenRaw), invoiceId);
        String path = invoice.getPaymentProofPath();
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("Payment proof not found");
        }
        if (!isPrivatePath(path)) {
            return fileStorageService.loadFileAsResource(path);
        }
        return fileStorageService.loadPrivateFileAsResource(path);
    }

    @Transactional
    public void logout(String sessionTokenRaw) {
        SubcontractorPortalToken token = getTokenByRawValue(sessionTokenRaw, SESSION_TOKEN_TYPE);
        token.setRevokedAt(OffsetDateTime.now());
        portalTokenRepository.save(token);
    }

    private SubcontractorInvoice getOwnedInvoice(SessionContext context, UUID invoiceId) {
        SubcontractorInvoice invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        if (!invoice.getSubcontractor().getId().equals(context.subcontractor().getId())) {
            throw new SecurityException("Access denied");
        }
        return invoice;
    }

    private SessionContext requireValidSession(String rawSessionToken) {
        SubcontractorPortalToken token = getTokenByRawValue(rawSessionToken, SESSION_TOKEN_TYPE);

        if (isRevoked(token) || isExpired(token)) {
            throw new SecurityException("Portal session expired or revoked");
        }

        token.setLastUsedAt(OffsetDateTime.now());
        portalTokenRepository.save(token);

        if (!ACTIVE_STATUS.equalsIgnoreCase(token.getSubcontractor().getStatus())) {
            throw new SecurityException("Subcontractor is not active");
        }

        return new SessionContext(token.getSubcontractor(), token.getCompany(), token);
    }

    private SubcontractorPortalToken getTokenByRawValue(String rawToken, String expectedType) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Portal token is required");
        }

        String tokenHash = hashToken(rawToken);
        SubcontractorPortalToken token = portalTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new IllegalArgumentException("Invalid portal token"));

        if (!expectedType.equals(token.getTokenType())) {
            throw new IllegalArgumentException("Invalid portal token type");
        }

        return token;
    }

    private void logAttempt(
        Company company,
        Subcontractor subcontractor,
        String contactEmail,
        String ipAddress,
        String userAgent,
        String outcome,
        String reason
    ) {
        portalAttemptRepository.save(
            SubcontractorPortalAttempt.builder()
                .company(company)
                .subcontractor(subcontractor)
                .contactEmail(contactEmail)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .outcome(outcome)
                .reason(reason)
                .build()
        );
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private void issueAndSendLoginToken(Subcontractor subcontractor, Company company, String ipAddress, String userAgent) {
        String loginToken = generateRandomToken();
        SubcontractorPortalToken savedLoginToken = SubcontractorPortalToken.builder()
            .subcontractor(subcontractor)
            .company(company)
            .tokenHash(hashToken(loginToken))
            .tokenType(LOGIN_TOKEN_TYPE)
            .expiresAt(OffsetDateTime.now().plusMinutes(loginTokenMinutes))
            .createdIp(ipAddress)
            .createdUserAgent(userAgent)
            .build();

        portalTokenRepository.save(savedLoginToken);

        log.info("Subcontractor portal base URL resolved to {}", subcontractorPortalBaseUrl);
        String link = subcontractorPortalBaseUrl + "?token=" + loginToken;
        log.info("Generated subcontractor portal login link for subcontractor {} and company {}", subcontractor.getId(), company.getId());
        emailService.sendSubcontractorPortalAccessEmail(
            subcontractor.getContactEmail(),
            resolveDisplayName(subcontractor),
            company.getName(),
            link,
            loginTokenMinutes
        );
    }

    private String resolveDisplayName(Subcontractor subcontractor) {
        if ("COMPANY".equalsIgnoreCase(subcontractor.getType()) && subcontractor.getCompanyName() != null) {
            return subcontractor.getCompanyName();
        }
        String first = subcontractor.getContactFirstName() != null ? subcontractor.getContactFirstName() : "";
        String last = subcontractor.getContactLastName() != null ? subcontractor.getContactLastName() : "";
        return (first + " " + last).trim();
    }

    private String generateRandomToken() {
        byte[] bytes = new byte[32];
        ThreadLocalRandom.current().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", ex);
        }
    }

    private boolean isExpired(SubcontractorPortalToken token) {
        return token.getExpiresAt().isBefore(OffsetDateTime.now());
    }

    private boolean isRevoked(SubcontractorPortalToken token) {
        return token.getRevokedAt() != null;
    }

    private boolean isPrivatePath(String storedPath) {
        return storedPath != null && storedPath.startsWith("private/");
    }

    private PortalContractResponse mapContract(SubcontractorContract contract) {
        String downloadUrl = null;
        if (contract.getContractDocumentPath() != null && !contract.getContractDocumentPath().isBlank()) {
            if (isPrivatePath(contract.getContractDocumentPath())) {
                downloadUrl = "/api/v1/subcontractors/portal/files/contracts/" + contract.getId();
            } else {
                downloadUrl = "/files/" + contract.getContractDocumentPath();
            }
        }

        return PortalContractResponse.builder()
            .id(contract.getId())
            .startDate(contract.getStartDate())
            .endDate(contract.getEndDate())
            .paymentType(contract.getPaymentType())
            .amount(contract.getAmount())
            .status(contract.getStatus())
            .notes(contract.getNotes())
            .documentDownloadUrl(downloadUrl)
            .createdAt(contract.getCreatedAt())
            .updatedAt(contract.getUpdatedAt())
            .build();
    }

    private PortalInvoiceResponse mapInvoice(SubcontractorInvoice invoice) {
        String invoiceDownloadUrl = null;
        if (invoice.getInvoiceDocumentPath() != null && !invoice.getInvoiceDocumentPath().isBlank()) {
            if (isPrivatePath(invoice.getInvoiceDocumentPath())) {
                invoiceDownloadUrl = "/api/v1/subcontractors/portal/files/invoices/" + invoice.getId() + "/invoice-document";
            } else {
                invoiceDownloadUrl = "/files/" + invoice.getInvoiceDocumentPath();
            }
        }

        String proofDownloadUrl = null;
        if (invoice.getPaymentProofPath() != null && !invoice.getPaymentProofPath().isBlank()) {
            if (isPrivatePath(invoice.getPaymentProofPath())) {
                proofDownloadUrl = "/api/v1/subcontractors/portal/files/invoices/" + invoice.getId() + "/payment-proof";
            } else {
                proofDownloadUrl = "/files/" + invoice.getPaymentProofPath();
            }
        }

        return PortalInvoiceResponse.builder()
            .id(invoice.getId())
            .contractId(invoice.getContract().getId())
            .invoiceNumber(invoice.getInvoiceNumber())
            .amount(invoice.getAmount() == null ? BigDecimal.ZERO : invoice.getAmount())
            .dueDate(invoice.getDueDate())
            .paidDate(invoice.getPaidDate())
            .status(invoice.getStatus())
            .notes(invoice.getNotes())
            .invoiceDocumentDownloadUrl(invoiceDownloadUrl)
            .paymentProofDownloadUrl(proofDownloadUrl)
            .createdAt(invoice.getCreatedAt())
            .updatedAt(invoice.getUpdatedAt())
            .build();
    }

    public record SessionContext(
        Subcontractor subcontractor,
        Company company,
        SubcontractorPortalToken token
    ) {}
}
