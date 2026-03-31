import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PublicRecruitmentService } from '../services/public-recruitment.service';
import { JobListingResponse } from '../models/public-recruitment.model';

@Component({
  selector: 'app-public-jobs-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="mx-auto max-w-6xl p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-semibold text-gray-900">Open positions</h1>
        <p class="text-sm text-gray-600">
          Browse current opportunities and apply without creating an account.
        </p>
      </div>

      @if (loading) {
        <div class="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Loading jobs...
        </div>
      }

      @if (!loading && errorMessage) {
        <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {{ errorMessage }}
        </div>
      }

      @if (!loading && !errorMessage && jobs.length === 0) {
        <div class="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
          No open jobs are available right now.
        </div>
      }

      @if (!loading && jobs.length > 0) {
        <div class="grid gap-4 md:grid-cols-2">
          @for (job of jobs; track job.id) {
            <article class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 class="text-xl font-medium text-gray-900">{{ job.title }}</h2>
              <p class="mt-1 text-sm text-gray-600">
                {{ job.companyName }} · {{ job.departmentName }}
              </p>

              <div class="mt-3 text-sm text-gray-700">
                <p><span class="font-medium">Type:</span> {{ job.employmentType }}</p>
                <p>
                  <span class="font-medium">Deadline:</span> {{ job.deadline | date: 'mediumDate' }}
                </p>
                @if (job.salaryMin || job.salaryMax) {
                  <p>
                    <span class="font-medium">Salary:</span>
                    {{ formatSalary(job) }}
                  </p>
                }
              </div>

              <p class="mt-3 line-clamp-3 text-sm text-gray-700">{{ job.description }}</p>

              <div class="mt-4 flex gap-2">
                <a
                  class="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  [routerLink]="['/jobs', job.id]"
                >
                  View details
                </a>
                <a
                  class="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
                  [routerLink]="['/jobs', job.id, 'apply']"
                >
                  Apply now
                </a>
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class PublicJobsListComponent implements OnInit {
  jobs: JobListingResponse[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly recruitmentService: PublicRecruitmentService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const companyId = params.get('companyId') ?? undefined;
      const departmentId = params.get('departmentId') ?? undefined;
      this.fetchJobs(companyId, departmentId);
    });
  }

  private fetchJobs(companyId?: string, departmentId?: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.recruitmentService
      .getPublicJobListings({ companyId, departmentId })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (jobs) => {
          this.jobs = jobs;
          this.cdr.detectChanges();
        },
        error: (error: { error?: { message?: string } }) => {
          this.errorMessage = error.error?.message ?? 'Unable to load jobs for now.';
          this.cdr.detectChanges();
        },
      });
  }

  formatSalary(job: JobListingResponse): string {
    if (job.salaryMin && job.salaryMax) {
      return `${job.salaryMin} - ${job.salaryMax}`;
    }

    if (job.salaryMin) {
      return `From ${job.salaryMin}`;
    }

    if (job.salaryMax) {
      return `Up to ${job.salaryMax}`;
    }

    return 'Not provided';
  }
}
