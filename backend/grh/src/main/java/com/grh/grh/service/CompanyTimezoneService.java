package com.grh.grh.service;

import com.grh.grh.entity.Company;
import com.grh.grh.entity.CompanySetting;
import org.springframework.stereotype.Service;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
public class CompanyTimezoneService {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Africa/Tunis");

    public ZoneId resolveCompanyZoneId(Company company) {
        if (company == null) {
            return DEFAULT_ZONE;
        }

        CompanySetting setting = company.getCompanySetting();
        String zoneName = setting != null ? setting.getTimezone() : null;
        if (zoneName == null || zoneName.isBlank()) {
            return DEFAULT_ZONE;
        }

        try {
            return ZoneId.of(zoneName.trim());
        } catch (DateTimeException ex) {
            return DEFAULT_ZONE;
        }
    }

    public LocalDate companyToday(Company company) {
        return LocalDate.now(resolveCompanyZoneId(company));
    }

    public boolean isDeadlineOver(LocalDate deadline, Company company) {
        if (deadline == null) {
            return false;
        }
        return deadline.isBefore(companyToday(company));
    }
}
