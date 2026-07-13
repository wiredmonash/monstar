import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { UserService } from '../services/api/user.service';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

// Flag to prevent multiple token refresh requests
let isRefreshing = false;

/**
 * ! HTTP Interceptor for automatic access token refresh
 *
 * This interceptor handles token expiration transparently by:
 * 1. Detecting 401 (Unauthorized) errors from expired access tokens
 * 2. Automatically calling the /users/refresh endpoint using the long-lived refresh token
 * 3. Retrying the original failed request with the new access token
 * 4. Clearing the session if the refresh token is also expired (403 from /refresh)
 *
 * @param req - The outgoing HTTP request
 * @param next - The next handler in the interceptor chain
 * @returns Observable of the HTTP response, with automatic retry on 401 errors
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const userService = inject(UserService);
  const router = inject(Router);

  /**
   * Skip interceptor logic for authentication endpoints to prevent infinite loops.
   * These endpoints manage tokens themselves and should not trigger refresh attempts.
   */
  const isAuthEndpoint =
    req.url.includes('/users/google/authenticate') ||
    req.url.includes('/users/refresh') ||
    req.url.includes('/users/logout');
  if (isAuthEndpoint) {
    return next(req);
  }

  // Process the request and handle authentication errors
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      /**
       * Handle 401 Unauthorized - Access token expired
       * Attempt to refresh the token and retry the request once.
       */
      if (error.status === 401 && !isRefreshing) {
        isRefreshing = true;

        return userService.refreshToken().pipe(
          switchMap(() => {
            // Refresh successful - reset flag and retry original request
            isRefreshing = false;
            return next(req);
          }),
          catchError((refreshError) => {
            // Refresh failed - clear the session and re-throw
            isRefreshing = false;
            userService.clearSession();
            return throwError(() => refreshError);
          })
        );
      }

      /**
       * Handle 403 Forbidden from /users/refresh - Refresh token expired
       * Clear the session immediately as the user needs to re-authenticate.
       */
      if (error.status === 403 && req.url.includes('/users/refresh')) {
        userService.clearSession();
      }

      // Re-throw all other errors for normal error handling
      return throwError(() => error);
    })
  );
};
