package com.grh.grh.dto.request.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiMatchRequest {
    private UUID jobListingId;
    private String jobTitle;
    private String jobDescription;
    private String requirements;
    private List<AiCandidatePayload> candidates;
}
