import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NotificationEntry, NotificationService, NotificationStream } from '../../services/notification/notification.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <section
      class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
          <p class="text-sm text-gray-500 dark:text-gray-300">
            {{ unreadCount }} unread notification{{ unreadCount === 1 ? '' : 's' }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="loadNotifications()"
            [disabled]="loading"
            class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60"
          >
            Refresh
          </button>
          <button
            type="button"
            (click)="markAllRead()"
            [disabled]="loading || unreadCount === 0"
            class="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium disabled:opacity-60 hover:bg-purple-700"
          >
            Mark all read
          </button>
        </div>
      </div>

      @if (errorMessage) {
        <div class="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          {{ errorMessage }}
        </div>
      }

      <div class="mt-5 space-y-3">
        @for (notification of notifications; track notification.id) {
          <article
            class="rounded-xl border p-4"
            [class]="
              notification.isRead
                ? 'border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-900/30'
                : 'border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-900/20'
            "
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ notification.title }}</h3>
                <p class="mt-1 text-sm text-gray-700 dark:text-gray-200">{{ notification.message }}</p>
                <p class="mt-2 text-xs text-gray-500 dark:text-gray-300">
                  {{ notification.createdAt | date: 'medium' }} • {{ notification.type }}
                </p>
              </div>

              @if (!notification.isRead) {
                <button
                  type="button"
                  (click)="markRead(notification)"
                  class="px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                >
                  Mark read
                </button>
              }
            </div>
          </article>
        } @empty {
          <div class="text-sm text-gray-400 py-8 text-center border border-dashed border-gray-300 rounded-xl">
            No notifications found.
          </div>
        }
      </div>
    </section>
  `,
})
export class NotificationsPage implements OnInit {
  notifications: NotificationEntry[] = [];
  unreadCount = 0;
  loading = false;
  errorMessage = '';
  private refreshIntervalId: ReturnType<typeof setInterval> | null = null;
  private stream: NotificationStream | null = null;

  constructor(
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.refreshIntervalId = setInterval(() => this.loadNotificationsSilently(), 15000);
    this.stream = this.notificationService.connectStream((entry) => {
      const existing = this.notifications.find((n) => n.id === entry.id);
      if (!existing) {
        this.notifications = [entry, ...this.notifications];
        if (!entry.isRead) {
          this.unreadCount += 1;
        }
      }
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = null;
    }
    this.stream?.close();
    this.stream = null;
  }

  loadNotifications(): void {
    this.loading = true;
    this.errorMessage = '';

    this.notificationService.getMyNotifications().subscribe({
      next: (res) => {
        this.notifications = res.data ?? [];
        this.unreadCount = this.notifications.filter((n) => !n.isRead).length;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to load notifications');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  markRead(notification: NotificationEntry): void {
    if (notification.isRead) {
      return;
    }

    this.notificationService.markRead(notification.id).subscribe({
      next: () => {
        notification.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to mark notification as read');
        this.cdr.detectChanges();
      },
    });
  }

  markAllRead(): void {
    if (this.unreadCount === 0) {
      return;
    }

    this.notificationService.markAllRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) => ({ ...n, isRead: true }));
        this.unreadCount = 0;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to mark all notifications as read');
        this.cdr.detectChanges();
      },
    });
  }

  private extractError(err: unknown, fallback: string): string {
    const maybeError = err as { error?: { message?: string } };
    return maybeError?.error?.message ?? fallback;
  }

  private loadNotificationsSilently(): void {
    this.notificationService.getMyNotifications().subscribe({
      next: (res) => {
        this.notifications = res.data ?? [];
        this.unreadCount = this.notifications.filter((n) => !n.isRead).length;
        this.cdr.detectChanges();
      },
      error: () => {
        // silent poll failure
      },
    });
  }
}
