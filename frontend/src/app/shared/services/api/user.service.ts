import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthState, IUser } from 'app/shared/models/v2/user.schema';
import { environment } from 'environments/environment';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';

interface UserResponse {
  message: string;
  data: IUser;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private url = environment.apiV2Url + '/users';
  private http = inject(HttpClient);

  private _currentUser = new BehaviorSubject<IUser | null>(null);
  public currentUser$: Observable<IUser | null> =
    this._currentUser.asObservable();
  get currentUserValue(): IUser | null {
    return this._currentUser.getValue();
  }

  private _authState = new BehaviorSubject<AuthState>('logged out');
  authState$: Observable<AuthState> = this._authState.asObservable();
  get currentAuthStateValue(): AuthState {
    return this._authState.getValue();
  }

  /* -------------------------- Auth state management ------------------------- */

  setState(state: AuthState): void {
    this._authState.next(state);
  }

  /**
   * Clears the current session state locally without calling the backend.
   *
   * Used by the auth interceptor when a token refresh fails: the cookies are
   * already invalid, so there is no authenticated /logout call to make — we
   * just drop the in-memory user so every caller observes a logged-out state.
   */
  clearSession(): void {
    this._currentUser.next(null);
    this._authState.next('logged out');
  }

  /* --------------------- Business logic state management -------------------- */

  getId() {
    const currentUser = this._currentUser.value;
    if (!currentUser) return;
    return currentUser._id;
  }

  addReview(reviewId: string) {
    const currentUser = this._currentUser.value;
    if (!currentUser) return;

    const updatedReviews = currentUser.reviews.concat(reviewId);
    this._currentUser.next({
      ...currentUser,
      reviews: updatedReviews,
    });
  }

  removeReview(reviewId: string) {
    const currentUser = this._currentUser.value;
    if (!currentUser) return;

    const updatedReviews = currentUser.reviews.filter(
      (revId) => revId !== reviewId
    );
    this._currentUser.next({
      ...currentUser,
      reviews: updatedReviews,
    });
  }

  toggleReaction(reviewId: string, reactionType: 'like' | 'dislike') {
    const user = this._currentUser.getValue();
    if (!user) return;

    const previousState = { ...user };

    const likedSet = new Set(user.likedReviews);
    const dislikedSet = new Set(user.dislikedReviews);

    if (reactionType === 'like') {
      if (likedSet.has(reviewId)) {
        likedSet.delete(reviewId); // un-like
      } else {
        likedSet.add(reviewId); // like
        dislikedSet.delete(reviewId); // remove dislike (if it exists)
      }
    } else {
      if (dislikedSet.has(reviewId)) {
        dislikedSet.delete(reviewId); // un-dislike
      } else {
        dislikedSet.add(reviewId); // dislike
        likedSet.delete(reviewId); // remove like (if it exists)
      }
    }

    this._currentUser.next({
      ...user,
      likedReviews: Array.from(likedSet),
      dislikedReviews: Array.from(dislikedSet),
    });

    return () => {
      console.warn('API failed: rolling back reaction update');
      this._currentUser.next(previousState);
    };
  }

  /* -------------------------------- API calls ------------------------------- */

  me(): Observable<IUser> {
    return this.http
      .get<IUser>(`${this.url}/me`)
      .pipe(tap((user) => this._currentUser.next(user)));
  }

  getByUsername(username: string): Observable<IUser> {
    return this.http.get<IUser>(`${this.url}/${username}`);
  }

  googleAuthenticate(idToken: string): Observable<IUser> {
    return this.http
      .post<UserResponse>(
        `${this.url}/google/authenticate`,
        { idToken },
        { withCredentials: true }
      )
      .pipe(
        map((response) => response.data),
        tap((user) => {
          this._currentUser.next(user);
        })
      );
  }

  refreshToken() {
    return this.http.post(`${this.url}/refresh`, {}, { withCredentials: true });
  }

  validateSession(): Observable<IUser> {
    return this.http
      .get<UserResponse>(`${this.url}/validate`, { withCredentials: true })
      .pipe(
        map((response) => response.data),
        tap((user) => {
          this._currentUser.next(user);
        })
      );
  }

  deleteAccount(userId: string): Observable<{ message: string }> {
    return this.http
      .delete<{
        message: string;
      }>(`${this.url}/delete/${userId}`, { withCredentials: true })
      .pipe(
        tap(() => {
          this._currentUser.next(null);
        })
      );
  }

  logout(): Observable<{ message: string }> {
    return this.http
      .post<{
        message: string;
      }>(`${this.url}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this._currentUser.next(null);
        })
      );
  }
}
