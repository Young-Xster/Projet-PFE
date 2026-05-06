import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { keycloak } from './keycloak';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  
  private permissions: string[] = [];
  public userContextLoaded = false;
  
  private readonly defaultRedirects = [
    { permission: 'employees:read', path: '/employees' },
    { permission: 'departments:read', path: '/departments' },
    { permission: 'attendance:read', path: '/attendance' },
    { permission: 'performance:read', path: '/performance' },
    { permission: 'positions:read', path: '/positions' },
    { permission: 'payroll:read', path: '/payroll' },
    { permission: 'recruitment_requests:read', path: '/jobs' },
    { permission: 'work_schedules:read', path: '/schedules' },
    { permission: 'leave_requests:read', path: '/leaves' },
  ];

  async loadUserContext(): Promise<void> {
    if (!this.isAuthenticated() || this.userContextLoaded) return;
    try {
      const res = await lastValueFrom(this.http.get<any>(`${environment.apiUrl}/auth/me`));
      if (res?.data?.companyContext?.permissions) {
         this.permissions = res.data.companyContext.permissions;
      }
      this.userContextLoaded = true;
    } catch (e) {
      console.warn('Failed to load user permissions context', e);
    }
  }

  hasPermission(perm: string): boolean {
    if (this.isSuperAdmin()) return true;
    return this.permissions.includes(perm);
  }

  getDefaultRoute(): string {
     for (const r of this.defaultRedirects) {
        if (this.hasPermission(r.permission)) return r.path;
     }
     return '/dashboard'; // Fallback
  }

  private readonly companyIdStorageKey = 'company_id';
  private readonly postLoginRedirectStorageKey = 'post_login_redirect';
  private readonly forceReauthStorageKey = 'force_reauth_after_logout';

  private getSafeRedirectUri(): string {
    return window.location.origin;
  }

  private buildLoginOptions(): { redirectUri: string; prompt?: 'login' } {
    const options: { redirectUri: string; prompt?: 'login' } = {
      redirectUri: this.getSafeRedirectUri(),
    };

    if (sessionStorage.getItem(this.forceReauthStorageKey) === '1') {
      sessionStorage.removeItem(this.forceReauthStorageKey);
      options.prompt = 'login';
    }

    return options;
  }

  login() {
    return keycloak.login(this.buildLoginOptions());
  }

  loginWithRedirect(path: string) {
    sessionStorage.setItem(this.postLoginRedirectStorageKey, path || '/dashboard');
    return keycloak.login(this.buildLoginOptions());
  }

  async logout(): Promise<void> {
    localStorage.removeItem(this.companyIdStorageKey);
    localStorage.removeItem('jwt_token');
    sessionStorage.removeItem(this.postLoginRedirectStorageKey);
    sessionStorage.setItem(this.forceReauthStorageKey, '1');

    const redirectUri = this.getSafeRedirectUri();

    try {
      await keycloak.logout({ redirectUri });
      return;
    } catch {}

    try {
      await keycloak.logout();
      return;
    } catch {}

    const logoutUrl =
      `${environment.keycloak.url}/realms/${environment.keycloak.realm}` +
      `/protocol/openid-connect/logout?client_id=${encodeURIComponent(environment.keycloak.clientId)}` +
      `&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`;

    window.location.assign(logoutUrl);
  }

  consumePostLoginRedirect(): string | null {
    const target = sessionStorage.getItem(this.postLoginRedirectStorageKey);
    if (target) {
      sessionStorage.removeItem(this.postLoginRedirectStorageKey);
      return target;
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!keycloak.authenticated;
  }

  getToken(): string | undefined {
    return keycloak.token;
  }

  getUsername(): string | undefined {
    return keycloak.tokenParsed?.['preferred_username'] as string | undefined;
  }

  hasRole(roleName: string): boolean {
    const parsed = keycloak.tokenParsed as Record<string, unknown> | undefined;
    const realmAccess = parsed?.['realm_access'] as Record<string, unknown> | undefined;
    const roles = realmAccess?.['roles'];

    if (!Array.isArray(roles)) {
      return false;
    }

    return roles.some(
      (role) => typeof role === 'string' && role.toUpperCase() === roleName.trim().toUpperCase(),
    );
  }

  isSuperAdmin(): boolean {
    return this.hasRole('SUPER_ADMIN');
  }

  getCompanyId(): string | null {
    const stored = localStorage.getItem(this.companyIdStorageKey);
    if (stored) {
      return stored;
    }

    const parsed = keycloak.tokenParsed as Record<string, unknown> | undefined;
    if (!parsed) {
      return null;
    }

    const directCandidate =
      this.asString(parsed['company_id']) ??
      this.asString(parsed['companyId']) ??
      this.asString(parsed['COMPANY_ID']);

    if (directCandidate) {
      this.setCompanyId(directCandidate);
      return directCandidate;
    }

    const attributes = parsed['attributes'] as Record<string, unknown> | undefined;
    const fromAttributes =
      this.asString(attributes?.['company_id']) ??
      this.asString(attributes?.['companyId']) ??
      this.asString(attributes?.['COMPANY_ID']);

    if (fromAttributes) {
      this.setCompanyId(fromAttributes);
      return fromAttributes;
    }

    return null;
  }

  setCompanyId(companyId: string): void {
    localStorage.setItem(this.companyIdStorageKey, companyId);
  }

  private asString(value: unknown): string | null {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim().length > 0) {
      return value[0];
    }
    return null;
  }
}
