import { Injectable, NgZone, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type NotificationEntry = {
  id: string;
  companyId: string;
  type: string;
  importance?: string;
  title: string;
  message: string;
  targetModule: string | null;
  targetId: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationStream = {
  close: () => void;
};

export type NotificationReadEvent =
  | { type: 'single'; notificationId: string }
  | { type: 'all' };

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly baseUrl = environment.apiUrl;
  private readonly unreadCountState = signal(0);
  readonly unreadCount = this.unreadCountState.asReadonly();
  private readonly readEventsSubject = new Subject<NotificationReadEvent>();
  readonly readEvents$ = this.readEventsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private ngZone: NgZone,
  ) {}

  setUnreadCount(count: number): void {
    this.unreadCountState.set(Math.max(0, Number.isFinite(count) ? Math.trunc(count) : 0));
  }

  incrementUnreadCount(delta = 1): void {
    const value = Number.isFinite(delta) ? Math.trunc(delta) : 0;
    if (value <= 0) {
      return;
    }
    this.unreadCountState.update((current) => current + value);
  }

  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: (res) => {
        this.setUnreadCount(res.data?.count ?? 0);
      },
      error: () => {
        this.setUnreadCount(0);
      },
    });
  }

  emitMarkedRead(notificationId: string): void {
    if (!notificationId) {
      return;
    }
    this.readEventsSubject.next({ type: 'single', notificationId });
  }

  emitMarkedAllRead(): void {
    this.readEventsSubject.next({ type: 'all' });
  }

  getMyNotifications(): Observable<ApiResponse<NotificationEntry[]>> {
    return this.http.get<ApiResponse<NotificationEntry[]>>(`${this.baseUrl}/notifications`);
  }

  getUnreadCount(): Observable<ApiResponse<{ count: number }>> {
    return this.http.get<ApiResponse<{ count: number }>>(`${this.baseUrl}/notifications/unread-count`);
  }

  markRead(notificationId: string): Observable<ApiResponse<NotificationEntry>> {
    return this.http.post<ApiResponse<NotificationEntry>>(
      `${this.baseUrl}/notifications/${notificationId}/mark-read`,
      {},
    );
  }

  markAllRead(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/notifications/mark-all-read`, {});
  }

  connectStream(onNotification: (entry: NotificationEntry) => void, onError?: () => void): NotificationStream | null {
    if (typeof window === 'undefined') {
      return null;
    }

    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      if (closed) {
        return;
      }

      const token = localStorage.getItem('jwt_token');
      if (!token) {
        reconnectTimer = setTimeout(connect, 3000);
        return;
      }

      const url = `${this.baseUrl}/notifications/stream?token=${encodeURIComponent(token)}`;
      source = new EventSource(url);

      source.addEventListener('notification', (event: MessageEvent<string>) => {
        try {
          const parsed = JSON.parse(event.data) as NotificationEntry;
          this.ngZone.run(() => {
            onNotification(parsed);
          });
        } catch {
          // ignore malformed payloads
        }
      });

      source.onerror = () => {
        this.ngZone.run(() => {
          onError?.();
        });
        source?.close();
        source = null;
        if (!closed) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return {
      close: () => {
        closed = true;
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        source?.close();
        source = null;
      },
    };
  }
}
