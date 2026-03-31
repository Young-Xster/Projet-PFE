import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { JobListingResponse } from '../models/public-recruitment.model';
import { PublicRecruitmentService } from '../services/public-recruitment.service';

@Component({
  selector: 'app-public-job-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="mx-auto max-w-5xl p-6">
      <a class="text-sm text-gray-600 hover:text-gray-900" routerLink="/jobs">← Back to jobs</a>

      @if (loading) {
        <div class="mt-4 rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Loading job details...
        </div>
      }

      @if (!loading && errorMessage) {
        <div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {{ errorMessage }}
        </div>
      }

      @if (!loading && job) {
        <article class="mt-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <header>
            <h1 class="text-3xl font-semibold text-gray-900">{{ job.title }}</h1>
            <p class="mt-1 text-sm text-gray-600">
              {{ job.companyName }} · {{ job.departmentName }}
            </p>
          </header>

          <div class="mt-4 grid gap-3 text-sm text-gray-700 md:grid-cols-2">
            <p><span class="font-medium">Employment type:</span> {{ job.employmentType }}</p>
            <p>
              <span class="font-medium">Deadline:</span> {{ job.deadline | date: 'mediumDate' }}
            </p>
            @if (job.salaryMin || job.salaryMax) {
              <p><span class="font-medium">Salary:</span> {{ formatSalary(job) }}</p>
            }
            <p><span class="font-medium">Open positions:</span> {{ job.numberOfPositions }}</p>
          </div>

          <section class="mt-6">
            <h2 class="text-lg font-medium text-gray-900">Description</h2>
            <p class="mt-2 whitespace-pre-line text-sm text-gray-700">{{ job.description }}</p>
          </section>

          <section class="mt-6">
            <h2 class="text-lg font-medium text-gray-900">Requirements</h2>
            <p class="mt-2 whitespace-pre-line text-sm text-gray-700">{{ job.requirements }}</p>
          </section>

          <div class="mt-8">
            <a
              class="inline-flex rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
              [routerLink]="['/jobs', job.id, 'apply']"
            >
              Apply for this job
            </a>
          </div>
        </article>
      }
    </section>
  `,
})
export class PublicJobDetailComponent implements OnInit {
  job: JobListingResponse | null = null;
  loading = false;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly recruitmentService: PublicRecruitmentService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const listingId = this.route.snapshot.paramMap.get('listingId');
    if (!listingId) {
      this.errorMessage = 'Invalid job link.';
      return;
    }

    this.loading = true;
    this.recruitmentService
      .getPublicJobById(listingId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (job) => {
          this.job = job;
          this.cdr.detectChanges();
        },
        error: (error: { error?: { message?: string } }) => {
          this.errorMessage = error.error?.message ?? 'Unable to load this job posting.';
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
