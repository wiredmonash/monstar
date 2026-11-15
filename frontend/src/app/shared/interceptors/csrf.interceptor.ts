import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { CsrfService } from '../services/csrf.service';

export const csrfInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const csrfService = inject(CsrfService);

  const requiresCsrfToken = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    req.method.toUpperCase()
  );

  // Skip CSRF protection for read-only requests and the token endpoint
  if (!requiresCsrfToken || req.url.endsWith('/csrf-token')) {
    return next(req);
  }

  const withToken = (token: string) =>
    next(req.clone({ setHeaders: { 'X-CSRF-Token': token } }));

  return csrfService.ensureToken().pipe(
    switchMap(withToken),
    catchError((error) => {
      const isCsrfFailure =
        error.status === 403 &&
        (error.error?.message?.includes('CSRF') ||
          error.error?.message?.includes('csrf') ||
          error.error?.code === 'EBADCSRFTOKEN');
      if (!isCsrfFailure) return throwError(() => error);

      // The cached token is stale: fetch a fresh one and retry once
      csrfService.clearToken();
      return csrfService.fetchToken().pipe(switchMap(withToken));
    })
  );
};
