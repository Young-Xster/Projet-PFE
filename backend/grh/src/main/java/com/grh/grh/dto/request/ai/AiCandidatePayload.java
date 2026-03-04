package com.grh.grh.dto.request.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCandidatePayload {
    private UUID candidateId;
    private String firstName;
    private String lastName;
    private String skills;
    private Integer experienceYears;
    private String educationLevel;
    private String cvBase64;
    private String cvFileName;
}
