import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RecruitmentService } from '../../services/recruitment/recruitment.service';
import { CandidateResponse, JobListingResponse } from '../../models/recruitment.model';
import { EmployeeSkeletonLoader } from '../../loaders/employeeSkeletonLoader';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-candidate-tracker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EmployeeSkeletonLoader],
  providers: [DecimalPipe],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Header / Job Details -->
      @if (job) {
        <div
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-wrap justify-between items-center gap-4"
        >
          <div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ job.title }}
              <span
                class="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full ml-2"
                >{{ job.status }}</span
              >
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ job.departmentName }} • {{ job.employmentType }}
            </p>
          </div>
          <div class="flex gap-3">
            <button
              (click)="triggerAiMatch()"
              [disabled]="aiLoading"
              class="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              @if (aiLoading) {
                <svg
                  class="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Processing AI...
              } @else {
                <svg
                  class="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  ></path>
                </svg>
                Rate Candidates with AI
              }
            </button>
          </div>
        </div>
      }

      <!-- Table Section -->
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        @if (loading) {
          <app-employee-skeleton-loader />
        } @else {
          <div class="overflow-x-auto w-full inline-block align-middle">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th
                    class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider whitespace-nowrap"
                  >
                    Candidate
                  </th>
                  <th
                    class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider whitespace-nowrap"
                  >
                    AI Match Score
                  </th>
                  <th
                    class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider whitespace-nowrap"
                  >
                    Current Stage
                  </th>
                  <th
                    class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider whitespace-nowrap"
                  >
                    Status
                  </th>
                  <th
                    class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider whitespace-nowrap"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (candidate of candidates; track candidate.id) {
                  <tr
                    class="border-b border-gray-100 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors duration-100"
                  >
                    <td class="px-5 py-4 whitespace-nowrap">
                      <div class="flex items-center gap-3">
                        <div
                          class="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm"
                        >
                          {{ candidate.firstName[0] }}{{ candidate.lastName[0] }}
                        </div>
                        <div>
                          <div class="font-medium text-gray-900 dark:text-gray-100">
                            {{ candidate.firstName }} {{ candidate.lastName }}
                          </div>
                          <div class="text-xs text-gray-500">{{ candidate.email }}</div>
                          <div class="text-[11px] text-blue-600 mt-0.5">
                            @if (candidate.cvFileUrl) {
                              <a
                                [href]="candidate.cvFileUrl"
                                target="_blank"
                                class="hover:underline flex items-center gap-1"
                              >
                                <svg
                                  class="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                  ></path>
                                </svg>
                                View CV
                              </a>
                            } @else {
                              <span class="text-gray-400">No CV Attached</span>
                            }
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-5 py-4 whitespace-nowrap">
                      @if (candidate.aiMatchScore) {
                        <div class="flex items-center gap-2">
                          <div
                            class="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px] dark:bg-gray-700"
                          >
                            <div
                              class="h-2.5 rounded-full"
                              [ngStyle]="{ width: candidate.aiMatchScore + '%' }"
                              [ngClass]="getScoreColor(candidate.aiMatchScore)"
                            ></div>
                          </div>
                          <span
                            class="text-sm font-semibold"
                            [ngClass]="getScoreTextColor(candidate.aiMatchScore)"
                            >{{ candidate.aiMatchScore | number: '1.0-0' }}%</span
                          >
                        </div>
                      } @else {
                        <span class="text-sm text-gray-400 italic">Not evaluated</span>
                      }
                    </td>
                    <td class="px-5 py-4 whitespace-nowrap">
                      <span
                        class="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                      >
                        Stage {{ candidate.currentStage || 1 }}
                      </span>
                    </td>
                    <td class="px-5 py-4 whitespace-nowrap">
                      <span
                        class="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                        [ngClass]="getStatusBadge(candidate.status)"
                      >
                        {{ candidate.status.replace('_', ' ') }}
                      </span>
                    </td>
                    <td class="px-5 py-4 whitespace-nowrap text-sm">
                      <div class="flex gap-2">
                        @if (candidate.status !== 'rejected' && candidate.status !== 'accepted') {
                          <button
                            (click)="advanceCandidate(candidate.id)"
                            class="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md font-medium transition-colors"
                          >
                            Advance
                          </button>
                          <button
                            (click)="rejectCandidate(candidate.id)"
                            class="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-md font-medium transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            (click)="hireCandidate(candidate)"
                            class="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-md font-medium shadow-sm transition-colors cursor-pointer"
                          >
                            Hire
                          </button>
                        } @else if (candidate.status === 'accepted') {
                          <span class="text-green-600 font-semibold flex items-center gap-1"
                            ><svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                            Hired</span
                          >
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td
                      colspan="5"
                      class="text-center py-12 px-5 text-gray-400 dark:text-gray-300 text-sm"
                    >
                      No candidates found for this position.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
})
export class CandidateTrackerComponent implements OnInit {
  jobId: string | null = null;
  job: JobListingResponse | null = null;
  candidates: CandidateResponse[] = [];

  loading = true;
  aiLoading = false;

  constructor(
    private route: ActivatedRoute,
    private recruitmentService: RecruitmentService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.jobId = params.get('id');
      if (this.jobId) {
        this.loadJobDetails();
        this.loadCandidates();
      }
    });
  }

  loadJobDetails() {
    if (!this.jobId) return;
    this.recruitmentService.getJobListingById(this.jobId).subscribe({
      next: (res) => {
        this.job = res.data;
        this.cdr.detectChanges();
      },
    });
  }

  loadCandidates() {
    if (!this.jobId) return;
    this.loading = true;
    this.recruitmentService
      .getCandidatesByJob(this.jobId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (res) => {
          this.candidates = res.data || [];
          this.sortCandidates();
        },
      });
  }

  sortCandidates() {
    this.candidates.sort((a, b) => {
      // Sort by score desc, then by stage desc
      const scoreA = a.aiMatchScore || 0;
      const scoreB = b.aiMatchScore || 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return (b.currentStage || 0) - (a.currentStage || 0);
    });
  }

  triggerAiMatch() {
    if (!this.jobId) return;
    this.aiLoading = true;
    this.recruitmentService
      .triggerAiMatch(this.jobId)
      .pipe(
        finalize(() => {
          this.aiLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (res) => {
          this.candidates = res.data || this.candidates;
          this.sortCandidates();
          alert('AI Scoring complete!');
        },
        error: (err) => {
          console.error('AI Error', err);
          alert('Error running AI Match. Please ensure ai-service is running.');
        },
      });
  }

  advanceCandidate(candidateId: string) {
    this.recruitmentService.advanceCandidate(candidateId).subscribe({
      next: () => this.loadCandidates(),
    });
  }

  rejectCandidate(candidateId: string) {
    if (confirm('Are you sure you want to reject this candidate?')) {
      this.recruitmentService.rejectCandidate(candidateId).subscribe({
        next: () => this.loadCandidates(),
      });
    }
  }

  hireCandidate(candidate: CandidateResponse) {
    if (
      confirm(
        `Are you sure you want to hire ${candidate.firstName}? This will convert them to an Employee.`,
      )
    ) {
      if (this.job) {
        this.recruitmentService
          .hireCandidate(candidate.id, this.job.departmentId, this.job.positionId)
          .subscribe({
            next: () => this.loadCandidates(),
            error: (err) => {
              console.error('Hire error', err);
              alert('Failed to hire candidate.');
            },
          });
      }
    }
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-400';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  }

  getScoreTextColor(score: number): string {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }

  getStatusBadge(status: string): string {
    if (status === 'accepted') return 'bg-green-100 text-green-700 border border-green-200';
    if (status === 'rejected') return 'bg-red-100 text-red-700 border border-red-200';
    if (status.startsWith('stage')) return 'bg-blue-100 text-blue-700 border border-blue-200';
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
}
