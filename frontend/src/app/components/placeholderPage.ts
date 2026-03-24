import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8"
    >
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">{{ title }}</h2>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-300">{{ description }}</p>
      @if (showLogoutButton) {
        <button
          type="button"
          (click)="onLogout()"
          class="mt-4 inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Logout
        </button>
      }
    </div>
  `,
})
export class PlaceholderPageComponent {
  title = 'Page';
  description = 'This section is ready for implementation.';
  showLogoutButton = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
  ) {
    this.title = this.route.snapshot.data['pageTitle'] ?? 'Page';
    this.description =
      this.route.snapshot.data['description'] ?? 'This section is ready for implementation.';
    this.showLogoutButton = this.route.snapshot.data['showLogoutButton'] === true;
  }

  onLogout() {
    this.authService.logout();
  }
}
