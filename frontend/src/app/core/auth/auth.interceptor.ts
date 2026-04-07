import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { keycloak } from './keycloak';
import { catchError, from, of, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const resolveToken = (): string | null => {
    return keycloak.token || localStorage.getItem('jwt_token');
  };

  const withToken = (request: typeof req) => {
    if (request.headers.has('Authorization')) {
      return request;
    }

    const token = resolveToken();
    if (!token) {
      return request;
    }

    localStorage.setItem('jwt_token', token);
    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  };

  const sendWithRecovery = (request: typeof req) =>
    next(withToken(request)).pipe(
      catchError((error) => {
        const shouldRetry =
          keycloak.authenticated &&
          (error?.status === 401 || error?.status === 403) &&
          !request.headers.has('x-auth-retried');

        if (!shouldRetry) {
          return throwError(() => error);
        }

        return from(keycloak.updateToken(0)).pipe(
          switchMap(() => {
            const retryRequest = request.clone({
              setHeaders: { 'x-auth-retried': '1' },
            });
            if (keycloak.token) {
              localStorage.setItem('jwt_token', keycloak.token);
            }
            return next(withToken(retryRequest));
          }),
          catchError(() => {
            localStorage.removeItem('jwt_token');
            keycloak.login({ redirectUri: window.location.href });
            return throwError(() => error);
          }),
        );
      }),
    );

  if (!keycloak.authenticated) {
    return sendWithRecovery(req);
  }

  return from(keycloak.updateToken(30)).pipe(
    catchError(() => of(false)),
    switchMap(() => {
      if (keycloak.token) {
        localStorage.setItem('jwt_token', keycloak.token);
      }
      return sendWithRecovery(req);
    }),
  );
};
