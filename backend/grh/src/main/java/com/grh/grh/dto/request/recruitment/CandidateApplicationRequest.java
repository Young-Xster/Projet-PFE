package com.grh.grh.dto.request.recruitment;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateApplicationRequest {

    @NotNull(message = "Job listing ID is required")
    private UUID jobListingId;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String phone;
    private LocalDate dateOfBirth;
    private String address;
    private String city;

    private String educationLevel;
    

    private Integer experienceYears;
    private String previousEmployer;
    private String skills;           // free text
    private String languagesSpoken;  // free text
    private LocalDate availabilityDate;

}