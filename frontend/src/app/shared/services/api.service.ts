import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Types } from 'mongoose';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // The URL of where the API Server is located
  private url = environment.apiUrl;

  // ! Inject HttpClient
  constructor(private http: HttpClient) {}

  /**
   * * GET Gets the notifications of a user
   */
  getUserNotificationsGET(userID: string): Observable<any> {
    const url = `${this.url}/notifications/user/${userID}`;
    return this.http.get(url);
  }

  /**
   * * DELETE Delete a notification by ID
   *
   * Deletes a notification by its ID.
   *
   * @param {string} notificationId The ID of the notification
   * @returns {Observable<any>} An observable containing the response from the server
   */
  deleteNotificationByIdDELETE(
    notificationId: Types.ObjectId
  ): Observable<any> {
    return this.http
      .delete(`${this.url}/notifications/${notificationId}`, {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: (response) => {
            // ? Debug log
            // console.log('ApiService | Successfully deleted notification:', response);
          },
          error: (error) => {
            // ? Debug log
            // console.log('ApiService | Error whilst deleting notification:', error.error);
          },
        })
      );
  }
}
