import Keycloak from 'keycloak-js';
import { environment } from '../../../environments/environment';

export const keycloak = new Keycloak({
  url: environment.keycloak.url,
  realm: environment.keycloak.realm,
  clientId: environment.keycloak.clientId,
});

export function initKeycloak(): () => Promise<boolean> {
  return () =>
    keycloak
      .init({
        onLoad: 'login-required',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      })
      .then((authenticated) => {
        if (!authenticated) {
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('company_id');
          return authenticated;
        }

        if (keycloak.token) {
          localStorage.setItem('jwt_token', keycloak.token);
        }

        const tokenParsed = keycloak.tokenParsed as Record<string, unknown> | undefined;
        const companyId =
          (typeof tokenParsed?.['company_id'] === 'string' && tokenParsed['company_id']) ||
          (typeof tokenParsed?.['companyId'] === 'string' && tokenParsed['companyId']) ||
          (Array.isArray(tokenParsed?.['attributes'])
            ? undefined
            : (tokenParsed?.['attributes'] as Record<string, unknown> | undefined)?.['company_id']);

        if (typeof companyId === 'string' && companyId.trim().length > 0) {
          localStorage.setItem('company_id', companyId);
        }

        return authenticated;
      });
}
