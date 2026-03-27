import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type UserContext = {
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

export type Company = {
  id: string;
  name: string;
  code: string;
  industryType?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoPath?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CompanyPayload = {
  name: string;
  code: string;
  industryType?: string;
  adress?: string;
  phoneNumber?: string;
  email?: string;
};

export type CompanySettings = {
  id: string;
  companyId: string;
  companyName: string;
  workHoursStart: string;
  workHoursEnd: string;
  gracePeriodMinutes: number;
  currency: string;
  dateFormat: string;
  timezone: string;
};

export type CompanySettingsPayload = {
  workHoursStart?: string;
  workHoursEnd?: string;
  gracePeriodMinutes?: number;
  currency?: string;
  dateFormat?: string;
  timezone?: string;
};

export type Role = {
  roleName: string;
  description?: string;
  permissions: string[];
};

export type PermissionCatalog = {
  modules: Array<{
    moduleName: string;
    displayName: string;
    actions: Array<{
      id: string | null;
      name: string;
      action: string;
      displayName: string;
      description: string;
      enabled: boolean;
    }>;
  }>;
};

export type AdminUser = {
  id: string;
  keycloakId: string;
  username: string;
  email: string;
  companyId: string | null;
  isActive: boolean;
  isSuperAdmin: boolean;
  roleNames: string[];
  message?: string;
};

export type CreateUserPayload = {
  username: string;
  email: string;
  companyId: string;
  roleName: string;
};

export type ActivityLogEntry = {
  id: string;
  companyId: string;
  userId: string | null;
  username: string | null;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
};

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMe(): Observable<ApiResponse<UserContext>> {
    return this.http.get<ApiResponse<UserContext>>(`${this.baseUrl}/auth/me`);
  }

  getCompanies(): Observable<ApiResponse<Company[]>> {
    return this.http.get<ApiResponse<Company[]>>(`${this.baseUrl}/companies`);
  }

  createCompany(payload: CompanyPayload): Observable<ApiResponse<Company>> {
    return this.http.post<ApiResponse<Company>>(`${this.baseUrl}/companies`, payload);
  }

  updateCompany(companyId: string, payload: CompanyPayload): Observable<ApiResponse<Company>> {
    return this.http.put<ApiResponse<Company>>(`${this.baseUrl}/companies/${companyId}`, payload);
  }

  deactivateCompany(companyId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/companies/${companyId}`);
  }

  getCompanySettings(companyId: string): Observable<ApiResponse<CompanySettings>> {
    return this.http.get<ApiResponse<CompanySettings>>(
      `${this.baseUrl}/companies/${companyId}/settings`,
    );
  }

  updateCompanySettings(
    companyId: string,
    payload: CompanySettingsPayload,
  ): Observable<ApiResponse<CompanySettings>> {
    return this.http.put<ApiResponse<CompanySettings>>(
      `${this.baseUrl}/companies/${companyId}/settings`,
      payload,
    );
  }

  getRoles(): Observable<ApiResponse<Role[]>> {
    return this.http.get<ApiResponse<Role[]>>(`${this.baseUrl}/roles`);
  }

  getPermissionCatalog(): Observable<ApiResponse<PermissionCatalog>> {
    return this.http.get<ApiResponse<PermissionCatalog>>(`${this.baseUrl}/roles/permissions`);
  }

  createRole(payload: {
    roleName: string;
    description?: string;
    permissions: string[];
  }): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>(`${this.baseUrl}/roles`, payload);
  }

  updateRolePermissions(roleName: string, permissions: string[]): Observable<ApiResponse<Role>> {
    return this.http.put<ApiResponse<Role>>(
      `${this.baseUrl}/roles/${encodeURIComponent(roleName)}/permissions`,
      {
        permissions,
      },
    );
  }

  deleteRole(roleName: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}/roles/${encodeURIComponent(roleName)}`,
    );
  }

  getUsers(filters?: {
    companyId?: string;
    active?: boolean;
  }): Observable<ApiResponse<AdminUser[]>> {
    let params = new HttpParams();
    if (filters?.companyId) {
      params = params.set('companyId', filters.companyId);
    }
    if (typeof filters?.active === 'boolean') {
      params = params.set('active', String(filters.active));
    }

    return this.http.get<ApiResponse<AdminUser[]>>(`${this.baseUrl}/users`, { params });
  }

  createUser(payload: CreateUserPayload): Observable<ApiResponse<AdminUser>> {
    return this.http.post<ApiResponse<AdminUser>>(`${this.baseUrl}/users`, payload);
  }

  updateUserRole(userId: string, roleName: string): Observable<ApiResponse<AdminUser>> {
    return this.http.put<ApiResponse<AdminUser>>(`${this.baseUrl}/users/${userId}/role`, {
      roleName,
    });
  }

  resendSetupEmail(userId: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `${this.baseUrl}/users/${userId}/resend-setup-email`,
      {},
    );
  }

  deleteUser(userId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/users/${userId}`);
  }

  getActivityLogs(
    companyId: string,
    startDate?: string,
    endDate?: string,
  ): Observable<ApiResponse<ActivityLogEntry[]>> {
    if (startDate && endDate) {
      const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
      return this.http.get<ApiResponse<ActivityLogEntry[]>>(
        `${this.baseUrl}/activity-logs/company/${companyId}/range`,
        { params },
      );
    }

    return this.http.get<ApiResponse<ActivityLogEntry[]>>(
      `${this.baseUrl}/activity-logs/company/${companyId}`,
    );
  }
}
