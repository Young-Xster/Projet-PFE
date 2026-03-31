import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import { JobListingResponse } from '../models/public-recruitment.model';
import { PublicRecruitmentService } from '../services/public-recruitment.service';

declare global {
  interface Window {
    onPublicTurnstileSuccess?: (token: string) => void;
    turnstile?: { reset: () => void };
  }
}

@Component({
  selector: 'app-public-apply',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="mx-auto max-w-4xl p-6">
      <a class="text-sm text-gray-600 hover:text-gray-900" [routerLink]="['/jobs', listingId]"
        >← Back to job details</a
      >

      <div class="mt-4">
        <h1 class="text-3xl font-semibold text-gray-900">Apply now</h1>
        @if (job) {
          <p class="text-sm text-gray-600">{{ job.title }} · {{ job.companyName }}</p>
        }
      </div>

      @if (globalError) {
        <div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {{ globalError }}
        </div>
      }

      @if (successMessage) {
        <div class="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {{ successMessage }}
        </div>
      }

      <form class="mt-6 grid gap-4" [formGroup]="form" (ngSubmit)="submit()">
        <div class="grid gap-4 md:grid-cols-2">
          <label class="grid gap-1 text-sm">
            <span>First name *</span>
            <input
              class="rounded-md border border-gray-300 px-3 py-2"
              type="text"
              formControlName="firstName"
            />
          </label>

          <label class="grid gap-1 text-sm">
            <span>Last name *</span>
            <input
              class="rounded-md border border-gray-300 px-3 py-2"
              type="text"
              formControlName="lastName"
            />
          </label>

          <label class="grid gap-1 text-sm md:col-span-2">
            <span>Email *</span>
            <input
              class="rounded-md border border-gray-300 px-3 py-2"
              type="email"
              formControlName="email"
            />
          </label>

          <label class="grid gap-1 text-sm">
            <span>Phone</span>
            <input
              class="rounded-md border border-gray-300 px-3 py-2"
              type="text"
              formControlName="phone"
            />
          </label>

          <label class="grid gap-1 text-sm">
            <span>Date of birth</span>
            <input
              class="rounded-md border border-gray-300 px-3 py-2"
              type="date"
              formControlName="dateOfBirth"
            />
          </label>

          <label class="grid gap-1 text-sm md:col-span-2">
            <span>Address</span>
            <input
              class="rounded-md border border-gray-300 px-3 py-2"
              type="text"
              formControlName="address"
            />
          </label>

          <label class="grid gap-1 text-sm">
            <span>City</span>
            <input
              class="rounded-md border border-gray-300 px-3 py-2"
              type="text"
              formControlName="city"
            />
          </label>

          <label class="grid gap-1 text-sm">
            <span>Education level</span>
            <input
              class="rounded-md border border-gray-300 px-3 py-2"
              type="text"
              formControlName="educationLevel"
            />
          </label>

          <label class="grid gap-1 text-sm">
            <span>Years of experience</span>
            <input
              class="rounded-md border border-gray-300 px-3 py-2"
              type="number"
              min="0"
              formControlName="experienceYears"
            />
          </label>

          <label class="grid gap-1 text-sm">
            <span>Previous employer</span>
            <input
              class="rounded-md border border-gray-300 px-3 py-2"
              type="text"
              formControlName="previousEmployer"
            />
          </label>

          <label class="grid gap-1 text-sm md:col-span-2">
            <span>Skills</span>
            <textarea
              class="rounded-md border border-gray-300 px-3 py-2"
              rows="3"
              formControlName="skills"
            ></textarea>
          </label>

          <label class="grid gap-1 text-sm md:col-span-2">
            <span>Languages spoken</span>
            <textarea
              class="rounded-md border border-gray-300 px-3 py-2"
              rows="2"
              formControlName="languagesSpoken"
            ></textarea>
          </label>

          <label class="grid gap-1 text-sm">
            <span>Availability date</span>
            <input
              class="rounded-md border border-gray-300 px-3 py-2"
              type="date"
              formControlName="availabilityDate"
            />
          </label>
        </div>

        <div class="mt-2 grid gap-3">
          <label class="grid gap-1 text-sm">
            <span>CV (pdf/jpg/png, max 3MB)</span>
            <input
              class="rounded-md border border-gray-300 px-3 py-2"
              type="file"
              (change)="onFileSelected($event, 'cv')"
            />
          </label>

          <label class="grid gap-1 text-sm">
            <span>Recommendation letter (pdf/jpg/png, max 3MB)</span>
            <input
              class="rounded-md border border-gray-300 px-3 py-2"
              type="file"
              (change)="onFileSelected($event, 'recommendationLetter')"
            />
          </label>

          <label class="grid gap-1 text-sm">
            <span>Certificates (pdf/jpg/png, max 3MB each)</span>
            <input
              class="rounded-md border border-gray-300 px-3 py-2"
              type="file"
              multiple
              (change)="onFileSelected($event, 'certificates')"
            />
          </label>
        </div>

        <div class="mt-2 rounded-lg border border-gray-200 bg-white p-4">
          @if (turnstileEnabled && !turnstileSiteKey) {
            <p class="text-sm text-red-600">
              Turnstile site key is not configured in frontend environment.
            </p>
          } @else if (turnstileEnabled) {
            <div
              class="cf-turnstile"
              [attr.data-sitekey]="turnstileSiteKey"
              data-callback="onPublicTurnstileSuccess"
            ></div>
          } @else {
            <p class="text-sm text-gray-600">
              Captcha verification is disabled for this environment.
            </p>
          }
        </div>

        @if (captchaError) {
          <p class="text-sm text-red-600">{{ captchaError }}</p>
        }

        <button
          type="submit"
          class="mt-2 w-fit rounded-md bg-gray-900 px-5 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-60"
          [disabled]="submitting"
        >
          {{ submitting ? 'Submitting...' : 'Submit application' }}
        </button>
      </form>
    </section>
  `,
})
export class PublicApplyComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly recruitmentService = inject(PublicRecruitmentService);
  private readonly cdr = inject(ChangeDetectorRef);

  listingId = '';
  job: JobListingResponse | null = null;
  submitting = false;
  globalError = '';
  successMessage = '';
  captchaError = '';
  private readonly requestTimeoutMs = 15000;
  readonly turnstileEnabled = environment.turnstileEnabled;
  readonly turnstileSiteKey = environment.turnstileSiteKey;

  readonly form = this.fb.group({
    jobListingId: ['', Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    dateOfBirth: [''],
    address: [''],
    city: [''],
    educationLevel: [''],
    experienceYears: [null as number | null],
    previousEmployer: [''],
    skills: [''],
    languagesSpoken: [''],
    availabilityDate: [''],
    turnstileToken: ['', Validators.required],
    cv: [null as File | null],
    recommendationLetter: [null as File | null],
    certificates: [[] as File[]],
  });

  ngOnInit(): void {
    this.listingId = this.route.snapshot.paramMap.get('listingId') ?? '';
    this.form.patchValue({ jobListingId: this.listingId });

    if (this.listingId) {
      this.recruitmentService
        .getPublicJobById(this.listingId)
        .pipe(timeout(this.requestTimeoutMs))
        .subscribe({
          next: (job) => {
            this.job = job;
            this.cdr.detectChanges();
          },
          error: (error: { error?: { message?: string }; name?: string }) => {
            this.globalError =
              error?.name === 'TimeoutError'
                ? 'Request timed out while loading job details.'
                : (error.error?.message ?? 'Unable to load job details for application.');
            this.cdr.detectChanges();
          },
        });
    }

    window.onPublicTurnstileSuccess = (token: string) => {
      this.form.patchValue({ turnstileToken: token });
      this.captchaError = '';
    };

    if (this.turnstileEnabled && this.turnstileSiteKey) {
      this.loadTurnstileScript();
    } else {
      this.form.controls.turnstileToken.clearValidators();
      this.form.controls.turnstileToken.updateValueAndValidity();
    }
  }

  ngOnDestroy(): void {
    delete window.onPublicTurnstileSuccess;
  }

  onFileSelected(event: Event, target: 'cv' | 'recommendationLetter' | 'certificates'): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files) {
      return;
    }

    if (target === 'certificates') {
      this.form.patchValue({ certificates: Array.from(files) });
      return;
    }

    this.form.patchValue({ [target]: files.item(0) });
  }

  submit(): void {
    this.globalError = '';
    this.successMessage = '';

    if (this.turnstileEnabled && !this.turnstileSiteKey) {
      this.captchaError = 'Captcha is not configured. Please contact support.';
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.turnstileEnabled && !this.form.value.turnstileToken) {
        this.captchaError = 'Please complete captcha verification.';
      }
      return;
    }

    const formValue = this.form.getRawValue();

    this.submitting = true;
    this.recruitmentService
      .applyToJob({
        jobListingId: formValue.jobListingId ?? this.listingId,
        firstName: formValue.firstName ?? '',
        lastName: formValue.lastName ?? '',
        email: formValue.email ?? '',
        turnstileToken: this.turnstileEnabled ? (formValue.turnstileToken ?? '') : '',
        phone: formValue.phone ?? undefined,
        dateOfBirth: formValue.dateOfBirth ?? undefined,
        address: formValue.address ?? undefined,
        city: formValue.city ?? undefined,
        educationLevel: formValue.educationLevel ?? undefined,
        experienceYears: formValue.experienceYears ?? undefined,
        previousEmployer: formValue.previousEmployer ?? undefined,
        skills: formValue.skills ?? undefined,
        languagesSpoken: formValue.languagesSpoken ?? undefined,
        availabilityDate: formValue.availabilityDate ?? undefined,
        cv: formValue.cv ?? null,
        recommendationLetter: formValue.recommendationLetter ?? null,
        certificates: formValue.certificates ?? [],
      })
      .pipe(
        timeout(this.requestTimeoutMs),
        finalize(() => {
          this.submitting = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage =
            'Application submitted successfully. Check your email for confirmation.';
          this.form.patchValue({
            turnstileToken: '',
            cv: null,
            recommendationLetter: null,
            certificates: [],
          });
          if (this.turnstileEnabled) {
            window.turnstile?.reset();
          }
          this.cdr.detectChanges();
        },
        error: (error: { error?: { message?: string }; name?: string }) => {
          this.globalError =
            error?.name === 'TimeoutError'
              ? 'Request timed out while submitting your application. Please try again.'
              : (error.error?.message ?? 'Unable to submit your application right now.');
          this.form.patchValue({ turnstileToken: '' });
          if (this.turnstileEnabled) {
            window.turnstile?.reset();
          }
          this.cdr.detectChanges();
        },
      });
  }

  private loadTurnstileScript(): void {
    const existingScript = document.querySelector(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]',
    );
    if (existingScript) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
}
