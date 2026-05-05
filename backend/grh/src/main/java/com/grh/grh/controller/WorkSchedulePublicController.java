package com.grh.grh.controller;

import com.grh.grh.dto.common.ApiResponse;
import com.grh.grh.dto.response.schedule.WorkScheduleResponse;
import com.grh.grh.service.WorkScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/work-schedules/public")
@RequiredArgsConstructor
public class WorkSchedulePublicController {

    private final WorkScheduleService workScheduleService;

    @PostMapping("/active")
    public ApiResponse<WorkScheduleResponse> getActivePublicSchedule(
            @RequestBody Map<String, String> request
    ) {
        String email = request.get("email");
        String nationalId = request.get("nationalId");
        if (email == null || nationalId == null) {
            throw new IllegalArgumentException("Email and National ID are required");
        }
        return ApiResponse.success("Active schedule retrieved successfully",
                workScheduleService.getPublicActiveSchedule(email, nationalId));
    }
}
