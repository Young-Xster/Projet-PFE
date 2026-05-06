import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RecruitmentService } from '../../services/recruitment/recruitment.service';
import { CandidateResponse, JobListingResponse } from '../../models/recruitment.model';
import { EmployeeSkeletonLoader } from '../../loaders/employeeSkeletonLoader';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-candidate-tracker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, EmployeeSkeletonLoader],
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
                                [href]="getFileUrl(candidate.cvFileUrl)"
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
                          >
                            {{ candidate.aiMatchScore | number: '1.0-0' }}%
                          </span>
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
                        <button
                          (click)="openInspectModal(candidate)"
                          class="px-3 py-1.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md font-medium transition-colors"
                        >
                          Inspect
                        </button>
                        <button
                          (click)="openInterviewModal(candidate)"
                          class="px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md font-medium transition-colors"
                        >
                          Interview
                        </button>
                        @if (candidate.status !== 'rejected' && candidate.status !== 'accepted' && candidate.status !== 'hired') {
                          @if ((candidate.currentStage || 1) < 2) {
                            <button
                              (click)="advanceCandidate(candidate.id)"
                              class="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md font-medium transition-colors"
                            >
                              Advance
                            </button>
                          }
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
                        } @else if (candidate.status === 'accepted' || candidate.status === 'hired') {
                          <span class="text-green-600 font-semibold flex items-center gap-1">
                            <svg
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
                            Hired
                          </span>
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

      <!-- Inspect Modal -->
      @if (selectedCandidate) {
        <div
          class="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-fade-in-up"
          >
            <div
              class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center"
            >
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">Candidate Details</h3>
              <button
                (click)="closeInspectModal()"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            <div class="p-6 overflow-y-auto max-h-[75vh]">
              @if (selectedCandidate.aiMatchScore) {
                <div class="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                  <h4 class="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    AI Evaluation ({{ selectedCandidate.aiMatchScore | number: '1.0-1' }}/100)
                  </h4>
                  <p class="text-sm text-purple-800 dark:text-purple-400 whitespace-pre-wrap">{{ selectedCandidate.aiMatchRationale }}</p>
                </div>
              }

              @if (selectedCandidate.interviewDate) {
                <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <h4 class="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Interview Details</h4>
                  <div class="space-y-2">
                    <p class="text-sm text-blue-800 dark:text-blue-400"><b>Date:</b> {{ selectedCandidate.interviewDate | date:'medium' }}</p>
                    <p class="text-sm text-blue-800 dark:text-blue-400" *ngIf="selectedCandidate.hrInterviewScore != null"><b>HR Score:</b> {{ selectedCandidate.hrInterviewScore | number: '1.0-1' }}/100</p>
                    <p class="text-sm text-blue-800 dark:text-blue-400 whitespace-pre-wrap" *ngIf="selectedCandidate.hrInterviewNotes"><b>Notes:</b><br/>{{ selectedCandidate.hrInterviewNotes }}</p>
                  </div>
                </div>
              }

              <div class="flex items-center gap-4 mb-6">
                <div
                  class="w-14 h-14 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl"
                >
                  {{ selectedCandidate.firstName[0] }}{{ selectedCandidate.lastName[0] }}
                </div>
                <div>
                  <h4 class="text-xl font-semibold text-gray-900 dark:text-white">
                    {{ selectedCandidate.firstName }} {{ selectedCandidate.lastName }}
                  </h4>
                  <p class="text-sm text-gray-500">{{ selectedCandidate.email }}</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 text-sm mb-6">
                <div class="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                  <span
                    class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide"
                    >Status</span
                  >
                  <span class="font-medium text-gray-900 dark:text-gray-100 capitalize">{{
                    selectedCandidate.status.replace('_', ' ')
                  }}</span>
                </div>
                <div class="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                  <span
                    class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide"
                    >AI Match Score</span
                  >
                  <span class="font-medium text-gray-900 dark:text-gray-100">
                    {{
                      selectedCandidate.aiMatchScore
                        ? (selectedCandidate.aiMatchScore | number: '1.0-0') + '%'
                        : 'Not Evaluated'
                    }}
                  </span>
                </div>
                <div class="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                  <span
                    class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide"
                    >Education Level</span
                  >
                  <span class="font-medium text-gray-900 dark:text-gray-100">{{
                    selectedCandidate.educationLevel || 'N/A'
                  }}</span>
                </div>
                <div class="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                  <span
                    class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide"
                    >Experience</span
                  >
                  <span class="font-medium text-gray-900 dark:text-gray-100">{{
                    selectedCandidate.experienceYears !== undefined
                      ? selectedCandidate.experienceYears + ' Years'
                      : 'N/A'
                  }}</span>
                </div>
              </div>

              <div class="mb-4">
                <span class="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide"
                  >Skills</span
                >
                <div class="flex flex-wrap gap-2">
                  @for (skill of (selectedCandidate.skills || '').split(','); track skill) {
                    @if (skill.trim()) {
                      <span
                        class="px-2.5 py-1 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-md text-xs font-medium border border-purple-100 dark:border-purple-800"
                      >
                        {{ skill.trim() }}
                      </span>
                    }
                  }
                  @if (!selectedCandidate.skills) {
                    <span class="text-sm text-gray-500">None listed</span>
                  }
                </div>
              </div>

              <div class="mb-4">
                <span class="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide"
                  >Languages Spoken</span
                >
                <div class="flex flex-wrap gap-2">
                  @for (lang of (selectedCandidate.languagesSpoken || '').split(','); track lang) {
                    @if (lang.trim()) {
                      <span
                        class="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-md text-xs font-medium border border-blue-100 dark:border-blue-800"
                      >
                        {{ lang.trim() }}
                      </span>
                    }
                  }
                  @if (!selectedCandidate.languagesSpoken) {
                    <span class="text-sm text-gray-500">None listed</span>
                  }
                </div>
              </div>

              @if (selectedCandidate.aiMatchRationale) {
                <div
                  class="mb-4 bg-purple-50/50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-800/30"
                >
                  <span
                    class="block text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wide flex items-center gap-1.5"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    AI Reasoning
                  </span>
                  <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {{ selectedCandidate.aiMatchRationale }}
                  </p>
                </div>
              }

              <div class="mb-4">
                <span class="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide"
                  >Attachments</span
                >
                <div class="flex flex-col gap-2">
                  @if (selectedCandidate.recommendationLetterUrl) {
                    <a
                      [href]="getFileUrl(selectedCandidate.recommendationLetterUrl)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                      Recommendation Letter
                    </a>
                  }
                  @for (cert of selectedCandidate.certificateUrls; track cert; let i = $index) {
                    <a
                      [href]="getFileUrl(cert)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Certificate {{ i + 1 }}
                    </a>
                  }
                  @if (
                    !selectedCandidate.recommendationLetterUrl &&
                    (!selectedCandidate.certificateUrls ||
                      selectedCandidate.certificateUrls.length === 0)
                  ) {
                    <span class="text-sm text-gray-500">No attachments provided</span>
                  }
                </div>
              </div>
            </div>

            <div
              class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex flex-wrap justify-end gap-3 rounded-b-2xl"
            >
              <button
                (click)="closeInspectModal()"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Interview Scheduling Modal -->
      @if (interviewCandidate) {
        <div class="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700 animate-fade-in-up">
            <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">Interview Details</h3>
              <button (click)="closeInterviewModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div class="px-6 py-4 space-y-4">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Scheduling interview for: <span class="text-indigo-600 dark:text-indigo-400">{{ interviewCandidate.firstName }} {{ interviewCandidate.lastName }}</span>
              </p>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interview Date & Time</label>
                <input type="datetime-local" [(ngModel)]="interviewForm.interviewDate" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500">
                <p class="mt-1 text-xs text-gray-500">Updating this will email the candidate an invitation with the scheduled date.</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HR Interview Score (0-100)</label>
                <input type="number" min="0" max="100" [(ngModel)]="interviewForm.hrInterviewScore" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interview Notes</label>
                <textarea rows="3" [(ngModel)]="interviewForm.hrInterviewNotes" placeholder="Provide feedback and notes for this interview" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"></textarea>
              </div>
            </div>

            <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3 rounded-b-2xl">
              <button (click)="closeInterviewModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 transition-colors">Cancel</button>
              <button (click)="saveInterview()" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer">Save Details</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class CandidateTrackerComponent implements OnInit {
  jobId: string | null = null;
  job: JobListingResponse | null = null;
  candidates: CandidateResponse[] = [];
  selectedCandidate: CandidateResponse | null = null;
  interviewCandidate: CandidateResponse | null = null;
  interviewForm = {
    interviewDate: '',
    hrInterviewScore: null as number | null,
    hrInterviewNotes: ''
  };

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

  getFileUrl(cvUrl: string): string {
    return environment.apiUrl.replace('/api/v1', '') + '/files/' + cvUrl;
  }

  openInspectModal(candidate: CandidateResponse) {
    this.selectedCandidate = candidate;
    this.cdr.detectChanges();
  }

  closeInspectModal() {
    this.selectedCandidate = null;
    this.cdr.detectChanges();
  }

  openInterviewModal(candidate: CandidateResponse) {
    this.interviewCandidate = candidate;
    this.interviewForm = {
      interviewDate: candidate.interviewDate ? new Date(candidate.interviewDate).toISOString().slice(0, 16) : '',
      hrInterviewScore: candidate.hrInterviewScore ?? null,
      hrInterviewNotes: candidate.hrInterviewNotes || ''
    };
    this.cdr.detectChanges();
  }

  closeInterviewModal() {
    this.interviewCandidate = null;
    this.cdr.detectChanges();
  }

  saveInterview() {
    if (!this.interviewCandidate) return;
    
    const dDate = this.interviewForm.interviewDate ? new Date(this.interviewForm.interviewDate).toISOString() : undefined;
    
    this.recruitmentService.updateInterview(this.interviewCandidate.id, {
      interviewDate: dDate,
      hrInterviewScore: this.interviewForm.hrInterviewScore ?? undefined,
      hrInterviewNotes: this.interviewForm.hrInterviewNotes
    }).subscribe({
      next: () => {
        this.loadCandidates();
        
        // auto advance to stage 2 if interview gets scheduled and it's still at 1
        if (dDate && (this.interviewCandidate?.currentStage || 1) < 2 && this.interviewCandidate?.status !== 'rejected') {
          this.recruitmentService.advanceCandidate(this.interviewCandidate!.id).subscribe(() => this.loadCandidates());
        }

        this.closeInterviewModal();
      },
      error: (err) => {
        console.error('Error updating interview', err);
        alert('Failed to update interview details');
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
          // Filter out hired (accepted) candidates entirely from the list
          this.candidates = (res.data || []).filter((c) => c.status !== 'accepted');
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
        next: () => {
          // Re-load the list with updated candidate scores instead of overwriting with small match payloads
          this.loadCandidates();
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
      next: () => {
        this.loadCandidates();
        if (this.selectedCandidate?.id === candidateId) {
          this.closeInspectModal();
        }
      },
    });
  }

  rejectCandidate(candidateId: string) {
    if (confirm('Are you sure you want to reject this candidate?')) {
      this.recruitmentService.rejectCandidate(candidateId).subscribe({
        next: () => {
          this.loadCandidates();
          if (this.selectedCandidate?.id === candidateId) {
            this.closeInspectModal();
          }
        },
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
        const payload = {
          jobTitle: this.job.title,
          employmentType: this.job.employmentType,
          hireDate: new Date().toISOString().split('T')[0],
          ...(this.job.departmentId ? { departmentId: this.job.departmentId } : {}),
        };

        this.recruitmentService
          .hireCandidate(candidate.id, payload)
          .subscribe({
            next: () => {
              this.loadCandidates();
              if (this.selectedCandidate?.id === candidate.id) {
                this.closeInspectModal();
              }
            },
            error: (err) => {
              console.error('Hire error', err);
              const backendMessage = err?.error?.message || err?.error?.error || err?.message;
              alert(
                backendMessage
                  ? `Failed to hire candidate: ${backendMessage}`
                  : 'Failed to hire candidate.',
              );
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
