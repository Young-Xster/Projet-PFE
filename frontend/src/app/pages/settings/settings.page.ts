import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { keycloak } from '../../core/auth/keycloak';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Profile Section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">Profile Settings</h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Update your email address.</p>
        </div>
        
        <div class="px-6 py-6">
          <form [formGroup]="profileForm" (ngSubmit)="onSaveProfile()" class="space-y-6">
            <div class="grid grid-cols-1 gap-6">
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <div class="mt-1 relative rounded-md shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                     </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    formControlName="email"
                    class="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  />
                </div>
              </div>
            </div>

            <div *ngIf="profileSuccessMessage" class="rounded-md bg-green-50 dark:bg-green-900/30 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                     <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-green-800 dark:text-green-300">{{ profileSuccessMessage }}</p>
                </div>
              </div>
            </div>

            <div *ngIf="profileErrorMessage" class="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                   <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                     <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                   </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-red-800 dark:text-red-300">{{ profileErrorMessage }}</p>
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <button
                type="submit"
                [disabled]="profileForm.invalid || profileForm.pristine || isSavingProfile"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 <svg *ngIf="isSavingProfile" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Security Section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">Security Settings</h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your password and security preferences.</p>
        </div>
        
        <div class="px-6 py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-full p-2">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                 </svg>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">Password</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">Send a password reset email to change your password.</p>
              </div>
            </div>
            
            <button
              type="button"
              (click)="onChangePassword()"
              [disabled]="isRequestingPassword"
              class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg *ngIf="isRequestingPassword" class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700 dark:text-gray-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Change Password
            </button>
          </div>

          <div *ngIf="passwordSuccessMessage" class="mt-4 rounded-md bg-green-50 dark:bg-green-900/30 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                 <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                 </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-green-800 dark:text-green-300">{{ passwordSuccessMessage }}</p>
              </div>
            </div>
          </div>

          <div *ngIf="passwordErrorMessage" class="mt-4 rounded-md bg-red-50 dark:bg-red-900/30 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                 <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                   <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                 </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-red-800 dark:text-red-300">{{ passwordErrorMessage }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsPage implements OnInit {
  profileForm: FormGroup;
  
  isSavingProfile = false;
  profileSuccessMessage = '';
  profileErrorMessage = '';

  isRequestingPassword = false;
  passwordSuccessMessage = '';
  passwordErrorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.profileForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    const parsed = keycloak.tokenParsed;
    if (parsed) {
      this.profileForm.patchValue({
        email: parsed['email'] || ''
      });
    }
  }

  private buildAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken() || localStorage.getItem('jwt_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  onSaveProfile() {
    if (this.profileForm.invalid) return;

    this.isSavingProfile = true;
    this.profileSuccessMessage = '';
    this.profileErrorMessage = '';

    const payload = this.profileForm.value;

    this.http.put(`${environment.apiUrl}/auth/me/profile`, payload, { headers: this.buildAuthHeaders() })
      .pipe(
        finalize(() => this.isSavingProfile = false),
        catchError(err => {
          this.profileErrorMessage = err.error?.message || 'Failed to update profile. Please try again.';
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (response: any) => {
          const updatedEmail = response?.data?.email;

          if (updatedEmail) {
            this.profileForm.patchValue({ email: updatedEmail }, { emitEvent: false });
          }
          this.profileSuccessMessage =
            'Email updated successfully. If needed, use your identity provider account settings to change username.';
          this.profileForm.markAsPristine();
        },
        error: (err) => {
          console.error(err);
          this.isSavingProfile = false;
        }
      });
  }

  onChangePassword() {
    this.isRequestingPassword = true;
    this.passwordSuccessMessage = '';
    this.passwordErrorMessage = '';

    this.http.post(`${environment.apiUrl}/auth/me/change-password`, null, {
      headers: this.buildAuthHeaders(),
      responseType: 'text'
    })
      .pipe(
        finalize(() => this.isRequestingPassword = false),
        catchError(err => {
          this.passwordErrorMessage = err.error?.message || err.message || 'Failed to trigger password reset. Please try again.';
          return throwError(() => err);
        })
      )
      .subscribe({
        next: () => {
          this.passwordSuccessMessage = 'Password reset instructions have been sent to your email address.';
        },
        error: (err) => {
          console.error(err);
          this.isRequestingPassword = false;
        }
      });
  }
}
