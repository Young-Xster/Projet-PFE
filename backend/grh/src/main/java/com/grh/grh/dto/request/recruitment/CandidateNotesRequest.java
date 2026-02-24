package com.grh.grh.dto.request.recruitment;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateNotesRequest {

    @NotBlank(message = "Notes cannot be empty")
    private String notes;
}