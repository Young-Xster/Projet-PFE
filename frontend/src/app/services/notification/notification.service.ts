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
  title: string;
  message: string;
  targetModule: string | null;
  targetId: string | null;
  isRead: boolean;
  createdAt: string;
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
}
