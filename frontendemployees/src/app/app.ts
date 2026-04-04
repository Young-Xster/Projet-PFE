import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:8081/api/v1';

  // State
  step = signal<number>(1);
  loading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Step 1 Data
  email = signal<string>('');
  nationalId = signal<string>('');

  // Verified User Data
  employeeId = signal<string | null>(null);
  companyId = signal<string | null>(null);
  firstName = signal<string>('');

  // Step 2 Leave Types Data
  leaveTypes = signal<any[]>([]);
  hasLeaveTypes = signal<boolean>(true);

  // Step 2 Request Form Data
  leaveTypeId = signal<string | null>(null);
  startDate = signal<string>('');
  endDate = signal<string>('');
  totalDays = signal<number>(0);
  reason = signal<string>('');

  private recalculateTotalDays() {
    const start = this.startDate();
    const end = this.endDate();

    if (!start || !end) {
      this.totalDays.set(0);
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      this.totalDays.set(0);
      return;
    }

    if (endDate < startDate) {
      this.totalDays.set(0);
      this.errorMessage.set('End date cannot be before start date.');
      return;
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;
    this.totalDays.set(diffDays);
  }

  verifyEmployee() {
    const email = this.email().trim().toLowerCase();
    const nationalId = this.nationalId().trim();

    if (!email || !nationalId) {
      this.errorMessage.set('Please provide both Email and National ID.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const payload = { email, nationalId };

    this.http.post<any>(`${this.apiBaseUrl}/employees/public/verify`, payload).subscribe({
      next: (res) => {
        const verifiedData = res?.data;
        if (!verifiedData?.employeeId || !verifiedData?.companyId) {
          this.loading.set(false);
          this.errorMessage.set('Verification response is invalid. Please try again.');
          return;
        }

        this.employeeId.set(verifiedData.employeeId);
        this.companyId.set(verifiedData.companyId);
        this.firstName.set(verifiedData.firstName || '');
        this.fetchLeaveTypes(verifiedData.companyId);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.error?.message || 'Verification failed. Please check your details.',
        );
      },
    });
  }

  fetchLeaveTypes(companyId: string) {
    this.http.get<any>(`${this.apiBaseUrl}/leave-types/public/company/${companyId}`).subscribe({
      next: (res) => {
        const types = res.data || res || [];
        this.leaveTypes.set(types);
        this.hasLeaveTypes.set(Array.isArray(types) && types.length > 0);
        if (!types.length) {
          this.leaveTypeId.set(null);
          this.errorMessage.set(
            'No leave types are configured for your company yet. Please contact HR.',
          );
        } else {
          this.errorMessage.set('');
        }
        this.step.set(2);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set('Could not fetch leave types. Please try again.');
      },
    });
  }

  submitLeaveRequest() {
    this.recalculateTotalDays();

    if (!this.hasLeaveTypes()) {
      this.errorMessage.set(
        'No leave types are configured for your company yet. Please contact HR.',
      );
      return;
    }

    if (
      !this.leaveTypeId() ||
      !this.startDate() ||
      !this.endDate() ||
      !this.totalDays() ||
      !this.reason()
    ) {
      this.errorMessage.set('Please fill out all fields.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const payload = {
      nationalId: this.nationalId().trim(),
      email: this.email().trim().toLowerCase(),
      companyId: this.companyId(),
      leaveTypeId: this.leaveTypeId(),
      startDate: this.startDate(),
      endDate: this.endDate(),
      totalDays: Number(this.totalDays()),
      reason: this.reason(),
    };

    this.http.post<any>(`${this.apiBaseUrl}/leave-requests/public/submit`, payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set('Leave request submitted successfully!');
        this.step.set(3); // Success step
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit leave request.');
      },
    });
  }

  onStartDateChange(value: string) {
    this.startDate.set(value);
    this.errorMessage.set('');
    this.recalculateTotalDays();
  }

  onEndDateChange(value: string) {
    this.endDate.set(value);
    this.errorMessage.set('');
    this.recalculateTotalDays();
  }
}
