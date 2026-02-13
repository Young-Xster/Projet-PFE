package com.grh.grh.dto.response.company;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyResponse {
    private UUID id;
    private String name;
    private String code;
    private String industryType;
    private String address;
    private String phone;
    private String email;
    private String logoPath;
    private Boolean isActive;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}