package com.grh.grh.dto.request.subcontractor;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortalSessionExchangeRequest {

    @NotBlank(message = "token is required")
    private String token;
}
