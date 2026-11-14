import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  of,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CsrfService {
  private url = environment.apiUrl;
  private csrfToken = new BehaviorSubject<string | null>(null);
  private tokenFetchInProgress = false;

  constructor(private http: HttpClient) {}

  /**
   * Fetches a new CSRF token from the backend
   */
  fetchToken(): Observable<string> {
    if (this.tokenFetchInProgress) {
      return this.csrfToken.asObservable().pipe(
        tap((token) => {
          if (!token) {
            throw new Error('CSRF token fetch failed');
          }
        }),
        map((token) => token!)
      ) as Observable<string>;
    }

    this.tokenFetchInProgress = true;

    return this.http
      .get<{ csrfToken: string }>(`${this.url}/csrf-token`, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          this.csrfToken.next(response.csrfToken);
          this.tokenFetchInProgress = false;
        }),
        catchError((error) => {
          this.tokenFetchInProgress = false;
          return throwError(() => error);
        }),
        map((response) => response.csrfToken)
      );
  }

  /**
   * Ensures a valid CSRF token is available
   * Fetches a new token if none exists
   */
  ensureToken(): Observable<string> {
    const currentToken = this.csrfToken.value;
    return currentToken ? of(currentToken) : this.fetchToken();
  }

  /**
   * Clears the current CSRF token
   */
  clearToken(): void {
    this.csrfToken.next(null);
  }
}
