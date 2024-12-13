import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private url = 'http://localhost:8080/api/v1/auth';
  private currentUser = new BehaviorSubject<User | null>(null);

  // Set current user helper method
  setCurrentUser(user: User) {
    this.currentUser.next(user);
  }

  // Get current user helper method
  getCurrentUser(): Observable<User | null> {
    return this.currentUser.asObservable();
  }


  // ! Injects HttpClient
  constructor(private http: HttpClient) { }


  // * Register a user
  register(email: string, password: string): Observable<any> {
    return this.http.post(`${this.url}/register`, { email, password });
  }

  // * Login a user and set current user
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.url}/login`, 
      { email, password },
      { withCredentials: true }
    ).pipe(
      tap((response: any) => {
        // Update the current user with the response data
        const user = new User(response.data.email, response.data.username, response.data.reviews, response.data.profileImg, response.data.admin);
        this.currentUser.next(user);

        // ? Debug log
        console.log('AuthService Logged in as:', this.currentUser);
      })
    );
  }

  // * Logout a user
  logout(): Observable<any> {
    return this.http.post(`${this.url}/logout`, {}, 
      { withCredentials: true }
    ).pipe(
      tap(() => {
        this.currentUser.next(null);

        // ? Console log
        console.log('AuthService: Logged out.')
      })
    );
  }

  // * Validate session for user
  validateSession(): Observable<any> {
    return this.http.get(`${this.url}/validate`, 
      { withCredentials: true }
    ).pipe(
      tap((response: any) => {
        // Update the current user with the response data
        const user = new User(response.data.email, response.data.username, response.data.reviews, response.data.profileImg, response.data.admin);
        this.currentUser.next(user);

        // ? Debug log
        console.log('AuthService validated user as:', this.currentUser);
      })
    );
  }

  // * Verify and login the user
  verifyAndLogin(token: string): Observable<any> {
    return this.http.get(`${this.url}/verify-email/${token}`, 
      { withCredentials: true }
    ).pipe(
      tap((response: any) => {
        // Update the current user with the response data
        const user = new User(response.data.email, response.data.username, response.data.reviews, response.data.profileImg, response.data.admin);
        this.currentUser.next(user);

        // ? Debug log
        console.log('AuthService: Signed up, Verified, & Logged In as:', this.currentUser);
      })
    );
  }

  // * Update user details
  updateDetails(oldEmail: string, username?: string, password?: string) {
    return this.http.put(`${this.url}/update/${oldEmail}`, { username: username, password: password });
  }
}
