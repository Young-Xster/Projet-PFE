import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../services/theme/theme.service';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'side-bar-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside
      class="w-[250px] flex flex-col h-full shrink-0"
      style="background-color: var(--sip-surface); border-right: 1px solid var(--sip-border);"
    >
      <!-- Logo/Brand -->
      <div class="flex items-center py-6 px-5" style="border-bottom: 1px solid var(--sip-border);">
        <img src="/images/SIP_firma_horizontal_mac.webp" alt="SIP" class="h-9 w-auto object-contain" />
      </div>

      <!-- Navigation -->
      <nav class="flex flex-col py-4 px-3 flex-1 gap-1 overflow-y-auto">
        <a
          routerLink="/dashboard"
          routerLinkActive="active"
          class="flex items-center gap-3 py-2.5 px-4 rounded-lg text-gray-500 dark:text-gray-300 text-sm font-medium transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>Tableau de bord</span>
        </a>

        <a
          routerLink="/employees"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: false }"
          class="flex items-center gap-3 py-2.5 px-4 rounded-lg text-gray-500 dark:text-gray-300 text-sm font-medium transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <span>Tous les employés</span>
        </a>

        <a
          routerLink="/performance"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: false }"
          class="flex items-center gap-3 py-2.5 px-4 rounded-lg text-gray-500 dark:text-gray-300 text-sm font-medium transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span>Performance des employés</span>
        </a>

        <a
          routerLink="/departments"
          routerLinkActive="active"
          class="flex items-center gap-3 py-2.5 px-4 rounded-lg text-gray-500 dark:text-gray-300 text-sm font-medium transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <span>Tous les départements</span>
        </a>

        <a
          routerLink="/attendance"
          routerLinkActive="active"
          class="flex items-center gap-3 py-2.5 px-4 rounded-lg text-gray-500 dark:text-gray-300 text-sm font-medium transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span>Présence</span>
        </a>

        <a
          routerLink="/jobs"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: false }"
          class="flex items-center gap-3 py-2.5 px-4 rounded-lg text-gray-500 dark:text-gray-300 text-sm font-medium transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span>Emplois / Candidats</span>
        </a>

        <a
          routerLink="/schedules"
          routerLinkActive="active"
          class="flex items-center gap-3 py-2.5 px-4 rounded-lg text-gray-500 dark:text-gray-300 text-sm font-medium transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>Planning</span>
        </a>

        <a
          routerLink="/leaves"
          routerLinkActive="active"
          class="flex items-center gap-3 py-2.5 px-4 rounded-lg text-gray-500 dark:text-gray-300 text-sm font-medium transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>Congés</span>
        </a>

        <a
          routerLink="/notifications"
          routerLinkActive="active"
          class="flex items-center gap-3 py-2.5 px-4 rounded-lg text-gray-500 dark:text-gray-300 text-sm font-medium transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span>Notifications</span>
        </a>

        <a
          routerLink="/subcontractors"
          routerLinkActive="active"
          class="flex items-center gap-3 py-2.5 px-4 rounded-lg text-gray-500 dark:text-gray-300 text-sm font-medium transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 20h5V4H2v16h5m10 0v-5a3 3 0 00-3-3H10a3 3 0 00-3 3v5m10 0H7m8-11a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span>Sous-traitants</span>
        </a>

        @if (isSuperAdmin) {
          <a
            routerLink="/admin/companies"
            routerLinkActive="active"
            class="flex items-center gap-3 py-2.5 px-4 rounded-lg text-gray-500 dark:text-gray-300 text-sm font-medium transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 21h18M5 21V7l7-4 7 4v14M9 9h6m-6 4h6m-6 4h6"
              />
            </svg>
            <span>Company Admin</span>
          </a>

          <a
            routerLink="/admin/users-roles"
            routerLinkActive="active"
            class="flex items-center gap-3 py-2.5 px-4 rounded-lg text-gray-500 dark:text-gray-300 text-sm font-medium transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5V4H2v16h5m10 0v-5a3 3 0 00-3-3H10a3 3 0 00-3 3v5m10 0H7m8-11a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span>User & Roles</span>
          </a>

          <a
            routerLink="/admin/activity-logs"
            routerLinkActive="active"
            class="flex items-center gap-3 py-2.5 px-4 rounded-lg text-gray-500 dark:text-gray-300 text-sm font-medium transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Activity Log</span>
          </a>
        }

        <!-- Settings at bottom -->
        <a
          routerLink="/settings"
          routerLinkActive="active"
          class="flex items-center gap-3 py-2.5 px-4 rounded-lg text-gray-500 dark:text-gray-300 text-sm font-medium transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100 mt-auto"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>Paramètres</span>
        </a>

        <button
          type="button"
          (click)="logout()"
          class="w-full flex items-center gap-3 py-2.5 px-4 rounded-lg text-gray-500 dark:text-gray-300 text-sm font-medium transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
            />
          </svg>
          <span>Logout</span>
        </button>
      </nav>

      <!-- Theme Toggle -->
      <div class="flex gap-1 py-3 px-4 pb-5 mx-3" style="border-top: 1px solid var(--sip-border);">
        <button
          (click)="theme.setTheme('light')"
          [ngClass]="
            theme.mode() === 'light'
              ? 'text-white'
              : 'text-gray-500 dark:text-gray-300 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
          "
          class="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg border-none text-xs font-medium transition-all duration-150"
          [style.backgroundColor]="theme.mode() === 'light' ? 'var(--sip-accent-strong)' : 'transparent'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          Light
        </button>

        <button
          (click)="theme.setTheme('dark')"
          [ngClass]="
            theme.mode() === 'dark'
              ? 'text-white'
              : 'text-gray-500 dark:text-gray-300 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
          "
          class="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg border-none text-xs font-medium transition-all duration-150"
          [style.backgroundColor]="theme.mode() === 'dark' ? 'var(--sip-accent-strong)' : 'transparent'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
          Dark
        </button>
      </div>
    </aside>
  `,
  host: {
    class: 'block shrink-0 w-[250px] h-full',
  },
  styles: `
    aside nav :is(a, button) {
      color: var(--sip-text-soft) !important;
    }

    aside nav :is(a, button):hover {
      background-color: var(--sip-surface-alt) !important;
      color: var(--sip-text) !important;
    }

    .active {
      font-weight: 600 !important;
      color: var(--sip-accent-strong) !important;
      background-color: var(--sip-accent-soft) !important;
    }
  `,
})
export class SideBarNavigation {
  readonly isSuperAdmin: boolean;

  constructor(
    public theme: ThemeService,
    private authService: AuthService,
  ) {
    this.isSuperAdmin = this.authService.isSuperAdmin();
  }

  logout() {
    this.authService.logout();
  }
}
