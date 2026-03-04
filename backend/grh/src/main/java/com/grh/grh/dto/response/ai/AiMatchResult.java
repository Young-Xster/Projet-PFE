package com.grh.grh.dto.response.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiMatchResult {
    private UUID candidateId;
    private String candidateName;
    private BigDecimal score;
    private String reasoning;
}
