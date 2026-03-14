import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { keycloak } from './keycloak';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);
  if (!keycloak.authenticated) return next(req);

  const token = keycloak.token;
  if (!token) return next(req);

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(authReq);
};
