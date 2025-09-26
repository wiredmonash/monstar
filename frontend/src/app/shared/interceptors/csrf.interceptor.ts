import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap, catchError, throwError, of } from 'rxjs';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../../../environments/environment';

export const csrfInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const csrfService = inject(CsrfService);

  // Only add CSRF token to state-changing requests (POST, PUT, PATCH, DELETE)
  const requiresCsrfToken = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());

  // Skip CSRF token for the CSRF token endpoint itself to avoid infinite loops
  const isCsrfTokenEndpoint = req.url.endsWith('/csrf-token');

  if (!environment.production) {
    console.log(`CSRF Interceptor | ${req.method} ${req.url} - requiresCsrfToken: ${requiresCsrfToken}, isCsrfTokenEndpoint: ${isCsrfTokenEndpoint}`);
  }

  if (!requiresCsrfToken || isCsrfTokenEndpoint) {
    if (!environment.production) {
      console.log('CSRF Interceptor | Skipping CSRF token for this request');
    }
    return next(req);
  }

  if (!environment.production) {
    console.log('CSRF Interceptor | Adding CSRF token to request');
  }

  // Ensure we have a CSRF token and add it to the request
  return csrfService.ensureToken().pipe(
    switchMap(token => {
      const csrfRequest = req.clone({
        setHeaders: {
          'X-CSRF-Token': token
        }
      });
      return next(csrfRequest);
    }),
    catchError(error => {
      // If we get a 403 CSRF error, clear the token and retry once
      if (error.status === 403 && (
          error.error?.message?.includes('CSRF') ||
          error.error?.message?.includes('csrf') ||
          error.error?.code === 'EBADCSRFTOKEN'
        )) {
        if (!environment.production) {
          console.warn('CSRF token invalid, refreshing token and retrying request');
        }
        csrfService.clearToken();

        return csrfService.fetchToken().pipe(
          switchMap(newToken => {
            const retryRequest = req.clone({
              setHeaders: {
                'X-CSRF-Token': newToken
              }
            });
            return next(retryRequest);
          }),
          catchError(retryError => {
            if (!environment.production) {
              console.error('CSRF retry failed:', retryError);
            }
            return throwError(() => retryError);
          })
        );
      }

      // Handle other CSRF-related errors
      if (error.status === 403) {
        if (!environment.production) {
          console.warn('Access denied (403) for request:', req.url);
        }
      }

      return throwError(() => error);
    })
  );
};