package com.grh.grh.service;

import com.grh.grh.dto.request.settings.UpdateCompanySettingRequest;
import com.grh.grh.dto.response.settings.CompanySettingResponse;
import com.grh.grh.entity.Company;
import com.grh.grh.entity.CompanySetting;
import com.grh.grh.repository.CompanyRepository;
import com.grh.grh.repository.CompanySettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanySettingService {

    private final CompanySettingRepository settingRepository;
    private final CompanyRepository companyRepository;
    private final KeycloakUserService keycloakUserService;
    private final ActivityLogService activityLogService;

    @Transactional(readOnly = true)
    public CompanySettingResponse getSettings(UUID companyId, Authentication authentication) {
        validateCompanyAccess(companyId, authentication);
        CompanySetting setting = settingRepository.findByCompanyId(companyId)
            .orElseGet(() -> createDefaultSettings(companyId));
        return mapToResponse(setting);
    }

    @Transactional
    public CompanySettingResponse updateSettings(UUID companyId, UpdateCompanySettingRequest request,
                                                  Authentication authentication) {
        validateCompanyAccess(companyId, authentication);
        CompanySetting setting = settingRepository.findByCompanyId(companyId)
            .orElseGet(() -> createDefaultSettings(companyId));

        if (request.getWorkHoursStart() != null) setting.setWorkHoursStart(request.getWorkHoursStart());
        if (request.getWorkHoursEnd() != null) setting.setWorkHoursEnd(request.getWorkHoursEnd());
        if (request.getGracePeriodMinutes() != null) setting.setGracePeriodMinutes(request.getGracePeriodMinutes());
        if (request.getCurrency() != null) setting.setCurrency(request.getCurrency());
        if (request.getDateFormat() != null) setting.setDateFormat(request.getDateFormat());
        if (request.getTimezone() != null) setting.setTimezone(request.getTimezone());

        setting = settingRepository.save(setting);
        activityLogService.logActivity(
            companyId,
            resolveCurrentUserId(authentication),
            "COMPANY_SETTINGS_UPDATED",
            "COMPANY_SETTING",
            setting.getId()
        );
        log.info("Updated company settings for company: {}", companyId);
        return mapToResponse(setting);
    }

    private CompanySetting createDefaultSettings(UUID companyId) {
        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new IllegalArgumentException("Company not found: " + companyId));
        return settingRepository.save(CompanySetting.builder()
            .company(company)
            .workHoursStart(java.time.LocalTime.of(8, 0))
            .workHoursEnd(java.time.LocalTime.of(17, 0))
            .gracePeriodMinutes(10)
            .build());
    }

    private void validateCompanyAccess(UUID companyId, Authentication authentication) {
        if (keycloakUserService.isSuperAdmin(authentication)) return;
        UUID userCompanyId = keycloakUserService.getCurrentUserCompanyId(authentication);
        if (userCompanyId == null || !userCompanyId.equals(companyId)) {
            throw new SecurityException("Access denied");
        }
    }

    private UUID resolveCurrentUserId(Authentication authentication) {
        try {
            return keycloakUserService.getCurrentUserId(authentication);
        } catch (Exception ex) {
            return null;
        }
    }

    private CompanySettingResponse mapToResponse(CompanySetting s) {
        return CompanySettingResponse.builder()
            .id(s.getId())
            .companyId(s.getCompany().getId())
            .companyName(s.getCompany().getName())
            .workHoursStart(s.getWorkHoursStart())
            .workHoursEnd(s.getWorkHoursEnd())
            .gracePeriodMinutes(s.getGracePeriodMinutes())
            .currency(s.getCurrency())
            .dateFormat(s.getDateFormat())
            .timezone(s.getTimezone())
            .build();
    }
}
