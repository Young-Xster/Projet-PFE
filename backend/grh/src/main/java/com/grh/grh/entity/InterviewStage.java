package com.grh.grh.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "interview_stages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"company", "candidate"})
@ToString(exclude = {"company", "candidate"})
public class InterviewStage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @Column(name = "stage_name", nullable = false, length = 255)
    private String stageName;

    @Column(name = "stage_number")
    private Integer stageNumber;

    @Column(name = "scheduled_at")
    private OffsetDateTime scheduledAt;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "interviewer_ids", columnDefinition = "uuid[]")
    private UUID[] interviewerIds;

    @Column(length = 50)
    @Builder.Default
    private String status = "scheduled";

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column
    private Integer rating;
}