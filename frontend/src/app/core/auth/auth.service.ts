import { Injectable } from '@angular/core';
import { keycloak } from './keycloak';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly companyIdStorageKey = 'company_id';
  private readonly postLoginRedirectStorageKey = 'post_login_redirect';

  private getSafeRedirectUri(): string {
    return `${window.location.origin}/`;
  }

  login() {
    return keycloak.login({ redirectUri: this.getSafeRedirectUri() });
  }

  loginWithRedirect(path: string) {
    sessionStorage.setItem(this.postLoginRedirectStorageKey, path || '/dashboard');
    return keycloak.login({ redirectUri: this.getSafeRedirectUri() });
  }

  logout() {
    localStorage.removeItem(this.companyIdStorageKey);
    sessionStorage.removeItem(this.postLoginRedirectStorageKey);
    return keycloak.logout({ redirectUri: this.getSafeRedirectUri() });
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
