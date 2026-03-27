import { Injectable } from '@angular/core';
import { keycloak } from './keycloak';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
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
