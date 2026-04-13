import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

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
          onNotification(parsed);
        } catch {
          // ignore malformed payloads
        }
      });

      source.onerror = () => {
        onError?.();
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
