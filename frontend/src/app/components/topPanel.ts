import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { NotificationService, NotificationStream } from '../services/notification/notification.service';
import { AuthService } from '../core/auth/auth.service';

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
  imports: [CommonModule, RouterLink],
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
          routerLink="/notifications"
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
          @if (notificationService.unreadCount() > 0) {
            <span
              class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center"
            >
              {{ notificationService.unreadCount() > 99 ? '99+' : notificationService.unreadCount() }}
            </span>
          }
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
export class TopPanelComponent implements OnInit, OnDestroy {
  private readonly baseUrl = environment.apiUrl;
  private readonly authMeUrl = `${this.baseUrl}/auth/me`;

  displayName = 'User';
  subLabel = 'HR Manager';
  initials = 'U';
  private unreadRefreshIntervalId: ReturnType<typeof setInterval> | null = null;
  private stream: NotificationStream | null = null;
  private authMeSubscription: Subscription | null = null;
  private routerEventsSubscription: Subscription | null = null;

  constructor(
    private http: HttpClient,
    public notificationService: NotificationService,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    if (typeof window === 'undefined') return;

    // Initialize with Keycloak username immediately (available synchronously after login)
    const keycloakUsername = this.authService.getUsername();
    if (keycloakUsername) {
      this.displayName = keycloakUsername;
      this.initials = this.makeInitials(this.displayName);
    }

    // Then update from API for full context (company name, etc.)
    this.authMeSubscription = this.http.get<ApiResponse<UserContextResponse>>(this.authMeUrl).subscribe({
      next: (res) => {
        const u = res?.data;
        if (!u) return;

        this.displayName = u.username || this.displayName || 'User';
        this.initials = this.makeInitials(this.displayName);
        this.subLabel = u.isSuperAdmin
          ? 'Super Admin'
          : u.companyContext?.companyName || 'HR Manager';
      },
      error: (err) => {
        console.error('Failed to fetch user context:', err);
      },
    });

    this.notificationService.refreshUnreadCount();

    this.routerEventsSubscription = this.router.events.subscribe(() => {
      this.notificationService.refreshUnreadCount();
    });

    this.unreadRefreshIntervalId = setInterval(() => this.notificationService.refreshUnreadCount(), 15000);

    this.stream = this.notificationService.connectStream((entry) => {
      if (!entry.isRead) {
        this.notificationService.incrementUnreadCount();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.unreadRefreshIntervalId) {
      clearInterval(this.unreadRefreshIntervalId);
      this.unreadRefreshIntervalId = null;
    }
    this.authMeSubscription?.unsubscribe();
    this.authMeSubscription = null;
    this.routerEventsSubscription?.unsubscribe();
    this.routerEventsSubscription = null;
    this.stream?.close();
    this.stream = null;
  }

  private makeInitials(value: string): string {
    const parts = (value || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}
