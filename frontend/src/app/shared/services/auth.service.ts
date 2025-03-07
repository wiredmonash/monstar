import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../models/user.model';
import { ObjectId } from 'mongoose';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // URL for backend endpoints
  private url = 'http://localhost:8080/api/v1/auth';

  // Stores the current user as behaviour subject of type User (nullable)
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
  constructor (private http: HttpClient) { }


  /**
   * * Register a user
   * 
   * Registers a user with the provided email and password.
   * 
   * @param {string} email The email of the user.
   * @param {string} password The password of the user.
   * @returns {Observable<any>} an observable containing the response from the server.
   */
  register(email: string, password: string): Observable<any> {
    return this.http.post(`${this.url}/register`, { email, password });
  }

  /**
   * * Register and/or login a Google user
   * 
   * Register and/or logins a Google user using the Google ID token.
   * 
   * @param {string} idToken The Google id token of the user.
   * @returns {Observable<any>} an observable containing the response from the server.
   */
  googleAuthenticate(idToken: string): Observable<any> {
    return this.http.post(`${this.url}/google/authenticate`, 
      { idToken },
      { withCredentials: true }
    ).pipe(
      tap((response: any) => {
        // Update the current user with the response data
        const user = new User(
          response.data._id, 
          response.data.email, 
          response.data.username, 
          response.data.isGoogleUser,
          response.data.reviews, 
          response.data.profileImg, 
          response.data.admin, 
          response.data.verified,
          response.data.likedReviews,
          response.data.dislikedReviews 
        );
        this.currentUser.next(user);

        // ? Debug log
        console.log('AuthService | Logged in as:', this.currentUser);
      })
    );
  }

  /**
   * * Login a user and set current user
   * 
   * Logs in a user with the provided email and password.
   * Also sets the current user for the frontend.
   * 
   * @param {string} email The email of the user.
   * @param {string} password The password of the user.
   * @returns {Observable<any>} an observable containing the response from the server.
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.url}/login`, 
      { email, password },
      { withCredentials: true }
    ).pipe(
      tap((response: any) => {
        // Update the current user with the response data
        const user = new User(
          response.data._id, 
          response.data.email, 
          response.data.username,
          response.data.isGoogleUser, 
          response.data.reviews, 
          response.data.profileImg, 
          response.data.admin, 
          response.data.verified,
          response.data.likedReviews,
          response.data.dislikedReviews 
        );
        this.currentUser.next(user);

        // ? Debug log
        console.log('AuthService | Logged in as:', this.currentUser);
      })
    );
  }

  /**
   * * Logout the user
   * 
   * Logs out the current user and clears the current user data for the frontend.
   * 
   * @returns {Observable<any>} an observable containing the response from the server.
   */
  logout(): Observable<any> {
    return this.http.post(`${this.url}/logout`, {}, 
      { withCredentials: true }
    ).pipe(
      tap(() => {
        this.currentUser.next(null);

        // ? Console log
        console.log('AuthService | Logged out.')
      })
    );
  }

  /**
   * * Forgot password
   * 
   * Sends a password reset email to the user with the provided email.
   * 
   * @param {string} email The email of the user.
   * @returns {Observable<any>} an observable containing the response from the server.
   */
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.url}/forgot-password`, { email });
  }

  /**
   * * Reset password
   * 
   * Resets the user's password using the provided token.
   * 
   * @param {string} token The token to reset the password.
   * @param {string} password The new password for the user.
   * @returns {Observable<any>} an observable containing the response from the server.
   */
  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.url}/reset-password/${token}`, { password });
  }

  /**
   * * Validate the user's session
   * 
   * Validates the current user's session and updates the current user data.
   * 
   * @returns {Observable<any>} an observable containing the response from the server.
   */
  validateSession(): Observable<any> {
    return this.http.get(`${this.url}/validate`, 
      { withCredentials: true }
    ).pipe(
      tap((response: any) => {
        // Update the current user with the response data
        const user = new User(
          response.data._id, 
          response.data.email, 
          response.data.username, 
          response.data.isGoogleUser,
          response.data.reviews, 
          response.data.profileImg, 
          response.data.admin, 
          response.data.verified,
          response.data.likedReviews,
          response.data.dislikedReviews 
        );
        this.currentUser.next(user);

        // ? Debug log
        console.log('AuthService | validated user as:', this.currentUser);
      })
    );
  }

  /**
   * * Verify and login the user
   * 
   * Verifies the user's email using the provided token and logs them in.
   * Also sets the current user for the frontend.
   * 
   * @param token The token to verify the user's email
   * @returns {Observable<any>} an observable containing the response from the server.
   */
  verifyAndLogin(token: string): Observable<any> {
    return this.http.get(`${this.url}/verify-email/${token}`, 
      { withCredentials: true }
    ).pipe(
      tap((response: any) => {
        // Update the current user with the response data
        const user = new User(
          response.data._id, 
          response.data.email, 
          response.data.username, 
          response.data.isGoogleUser,
          response.data.reviews, 
          response.data.profileImg, 
          response.data.admin, 
          response.data.verified,
          response.data.likedReviews,
          response.data.dislikedReviews 
        );
        this.currentUser.next(user);

        // ? Debug log
        console.log('AuthService | Signed up, Verified, & Logged In as:', this.currentUser);
      })
    );
  }

  /**
   * * Update user details
   * 
   * Updates the user's details such as username and password.
   * 
   * @param {string} userId The MongoDB ID of the user.
   * @param {string} [username] The new username for the user.
   * @param {string} [password] The new password for the user.
   * @returns {Observable<any>} an observable containing the response from the server.
   */
  updateDetails(userId: string, username?: string, password?: string) {
    return this.http.put(`${this.url}/update/${userId}`, 
      { username: username, password: password }, 
      { withCredentials: true }
    ).pipe(
      tap((response: any) => {
        // Update the current user's username
        if (this.currentUser.value) {
          this.currentUser.value.username = response.username;

          // ? Debug log
          console.log('AuthService | Updated user details:', this.currentUser);
        }
      })
    );
  }

  /**
   * * Upload avatar
   * 
   * Uploads a new avatar for the user.
   * 
   * @param {string} file the avatar file to upload.
   * @param {string} email The email of the user.
   * @returns {Observable<{ profileImg: string }>} an observable containing updated profile image URL.
   */
  uploadAvatar(file: File, email: string): Observable<{ profileImg: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('email', email);

    return this.http.post<{ profileImg: string }>(`${this.url}/upload-avatar`, 
      formData, 
      { withCredentials: true }
    ).pipe(
      tap((response: any) => {
        // Update the current user's profile image
        if (this.currentUser.value) {
          this.currentUser.value.profileImg = response.profileImg;

          // ? Debug log
          console.log('AuthService | Uploaded avatar:', this.currentUser);
        }
      })
    );
  }

  /**
   * * Delete user account
   * 
   * Deletes the user's account.
   * 
   * @param {string} userId The MongoDB ID of the user.
   * @returns {Observable<any>} An observable containing the response from the server.
   */
  deleteUserAccount(userId: String): Observable<any> {
    return this.http.delete(`${this.url}/delete/${userId}`, 
      { withCredentials: true }
    ).pipe(
        tap(() => {
          this.currentUser.next(null);

          // ? Debug log
          console.log('AuthService | Deleted user account.')
        })
      );
  }
}
