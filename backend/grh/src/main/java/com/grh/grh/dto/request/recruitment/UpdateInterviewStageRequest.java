package com.grh.grh.dto.request.recruitment;

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
public class UpdateInterviewStageRequest {
    
    private OffsetDateTime scheduledAt;
    private UUID interviewerId;
    private String status;
    private String feedback;
    private String result; // pass, fail
}
