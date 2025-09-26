import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, throwError, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CsrfService {
  private url = environment.apiUrl;
  private csrfToken = new BehaviorSubject<string | null>(null);
  private tokenFetchInProgress = false;

  constructor(private http: HttpClient) {}

  /**
   * Gets the current CSRF token
   */
  getCurrentToken(): Observable<string | null> {
    return this.csrfToken.asObservable();
  }

  /**
   * Gets the current CSRF token value (synchronous)
   */
  getCurrentTokenValue(): string | null {
    return this.csrfToken.value;
  }

  /**
   * Fetches a new CSRF token from the backend
   */
  fetchToken(): Observable<string> {
    if (!environment.production) {
      console.log('CsrfService | Fetching CSRF token...');
    }

    if (this.tokenFetchInProgress) {
      if (!environment.production) {
        console.log('CsrfService | Token fetch already in progress, waiting...');
      }
      return this.csrfToken.asObservable().pipe(
        tap(token => {
          if (!token) {
            throw new Error('CSRF token fetch failed');
          }
        }),
        map(token => token!)
      ) as Observable<string>;
    }

    this.tokenFetchInProgress = true;

    return this.http.get<{ csrfToken: string }>(`${this.url}/csrf-token`, {
      withCredentials: true
    }).pipe(
      tap(response => {
        if (!environment.production) {
          console.log('CsrfService | Successfully fetched CSRF token:', response.csrfToken);
        }
        this.csrfToken.next(response.csrfToken);
        this.tokenFetchInProgress = false;
      }),
      catchError(error => {
        this.tokenFetchInProgress = false;
        if (!environment.production) {
          console.error('CsrfService | Error fetching CSRF token:', error);
        }
        return throwError(() => error);
      }),
      map(response => response.csrfToken)
    );
  }

  /**
   * Ensures a valid CSRF token is available
   * Fetches a new token if none exists
   */
  ensureToken(): Observable<string> {
    const currentToken = this.getCurrentTokenValue();

    if (currentToken) {
      return of(currentToken);
    }

    return this.fetchToken();
  }

  /**
   * Initialize CSRF token on app startup
   * Should be called during application bootstrap
   */
  initializeToken(): void {
    this.fetchToken().subscribe({
      next: () => {
        // Token initialized successfully
        if (!environment.production) {
          console.log('CSRF token initialized');
        }
      },
      error: (error) => {
        if (!environment.production) {
          console.warn('Failed to initialize CSRF token:', error);
        }
        // This is not critical for app startup, so we just log the warning
      }
    });
  }

  /**
   * Clears the current CSRF token
   */
  clearToken(): void {
    this.csrfToken.next(null);
  }
}