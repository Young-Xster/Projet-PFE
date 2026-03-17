import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type UserContextResponse = {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  lastLogin: string;
  companyContext?: {
    companyId: string;
    companyName: string;
    companyCode: string;
    permissions: string[];
  };
};

@Component({
  selector: 'app-top-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="w-full px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
    >
      <!-- Global search -->
      <div class="relative">
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search"
          class="pl-10 pr-4 py-2 w-64 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-100 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors bg-gray-50 dark:bg-gray-700"
        />
      </div>

      <!-- Right side: notification + user -->
      <div class="flex items-center gap-4">
        <button
          class="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg
            class="w-5 h-5 text-gray-600 dark:text-gray-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div class="w-px h-8 bg-gray-200 dark:bg-gray-600"></div>

        <!-- User avatar + info -->
        <div class="flex items-center gap-3 cursor-pointer">
          <div
            class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm shadow-md"
          >
            {{ initials }}
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">
              {{ displayName }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-300">{{ subLabel }}</p>
          </div>
          <svg
            class="w-4 h-4 text-gray-400 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  `,
})
export class TopPanelComponent implements OnInit {
  private readonly baseUrl = environment.apiUrl;
  private readonly authMeUrl = `${this.baseUrl}/auth/me`;

  displayName = 'User';
  subLabel = 'HR Manager';
  initials = 'U';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (typeof window === 'undefined') return;

    this.http.get<ApiResponse<UserContextResponse>>(this.authMeUrl).subscribe({
      next: (res) => {
        const u = res?.data;
        if (!u) return;

        this.displayName = u.username || 'User';
        this.initials = this.makeInitials(this.displayName);
        this.subLabel = u.isSuperAdmin
          ? 'Super Admin'
          : u.companyContext?.companyName || 'HR Manager';
      },
      error: (err) => {
        console.error('Failed to fetch user context:', err);
      },
    });
  }

  private makeInitials(value: string): string {
    const parts = (value || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}
