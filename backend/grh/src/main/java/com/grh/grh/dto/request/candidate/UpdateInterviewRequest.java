package com.grh.grh.dto.request.candidate;

import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
public class UpdateInterviewRequest {
    private OffsetDateTime interviewDate;
    private BigDecimal hrInterviewScore;
    private String hrInterviewNotes;
}
