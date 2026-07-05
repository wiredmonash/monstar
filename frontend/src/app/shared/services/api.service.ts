import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Types } from 'mongoose';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Unit } from '../models/unit.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // The URL of where the API Server is located
  private url = environment.apiUrl;
  private urlV2 = environment.apiV2Url;

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

  /**
   * * GET Get Unit by Unitcode
   *
   * Retrieves a unit by its unit code.
   *
   * @param {string} unitcode The unit code of the unit
   * @returns {Observable<Unit>} An observable containing the unit data
   */
  getUnitByUnitcodeGET(unitcode: string): Observable<Unit> {
    return this.http.get<Unit>(`${this.urlV2}/units/${unitcode}`).pipe(
      tap({
        next: (response) => {
          // ? Debug log
          // console.log('ApiService | Successfully fetched unit:', response);
        },
        error: (error) => {
          // ? Debug log
          // console.log('ApiService | Error whilst fetching unit:', error.error);
        },
      })
    );
  }

  /**
   * * GET Get Popular Units
   *
   * Retrieves the most popular units.
   *
   * @returns {Observable<Unit[]>} An observable containing an array of popular units
   */
  getPopularUnitsGET(): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.urlV2}/units/popular`).pipe(
      tap({
        next: (response) => {
          // ? Debug log
          // console.log('ApiService | Successfully fetched popular units:', response);
        },
        error: (error) => {
          // ? Debug log
          // console.log('ApiService | Error whilst fetching popular units:', error.error);
        },
      })
    );
  }

  /**
   * * GET Units Requiring Unit
   *
   * Gets all units that have a specified unit as a prerequisite
   *
   * @param {string} unitCode The unit code to search for
   * @returns {Observable<Unit[]>} An observable containing an array of units
   */
  getUnitsRequiringUnitGET(unitCode: string): Observable<Unit[]> {
    return this.http
      .get<Unit[]>(`${this.urlV2}/units/${unitCode}/required-by`)
      .pipe(
        tap({
          next: (units) => {
            // console.log('ApiService | Sucessfully got units requiring unit:', units);
          },
          error: (error) => {
            // console.log('ApiService | Error whilst getting units requiring unit:', error.error);
          },
        })
      );
  }
}
