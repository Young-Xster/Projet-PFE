package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.response.ai.AiMatchResult;
import com.grh.grh.service.AiMatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiMatchingController {

    private final AiMatchingService aiMatchingService;

    @PostMapping("/match/{jobListingId}")
    public ApiResponse<List<AiMatchResult>> match(@PathVariable UUID jobListingId) {
        return ApiResponse.success("Candidates ranked", aiMatchingService.matchCandidates(jobListingId));
    }
}
