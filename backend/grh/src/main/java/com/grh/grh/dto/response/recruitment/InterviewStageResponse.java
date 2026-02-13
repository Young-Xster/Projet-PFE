package com.grh.grh.dto.response.recruitment;

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
public class InterviewStageResponse {
    private UUID id;
    private UUID candidateId;
    private String candidateName;
    private String stageName;
    private Integer stageNumber;
    private OffsetDateTime scheduledAt;
    private UUID interviewerId;
    private String interviewerName;
    private String status;
    private String feedback;
    private String result;
    private OffsetDateTime createdAt;
}
