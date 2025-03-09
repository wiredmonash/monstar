import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Review } from '../models/review.model';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';
import { ObjectId, Types } from 'mongoose';
import { Unit } from '../models/unit.model';

interface ReportPayload {
  reportReason: string | null;
  reportDescription: string | null;
  reporterName: string | undefined;
  review: Review | null;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // The URL of where the API Server is located
  private url = '/api/v1';


  // ! Inject HttpClient
  constructor(
    private http: HttpClient,
  ) { }
  
  /**
   * * GET Get All Reviews
   * 
   * Retrieves all reviews or reviews for a specific unit if unit code is provided.
   * 
   * If the unit parameter is provided, we get all reviews by unit, if not get all the reviews.
   * 
   * @param {string} [unitcode] The unit code of the unit (optional)
   * @returns {Observable<any>} An observable containing the reviews data
   */
  getAllReviewsGET(unitcode?: string): Observable<any> {
    return this.http.get(
      unitcode ? `${this.url}/reviews/${unitcode}` : `${this.url}/reviews`
    ).pipe(
      tap({
        next: (response) => {
          // ? Debug log
          console.log('ApiService | Successfully fetched reviews:', response);
        },
        error: (error) => {
          // ? Debug log
          console.log('ApiService | Error whilst fetching reviews:', error.error);
        }
      })
    );
  }

  /**
   * * GET Gets the reviews written by a user
   * 
   * Retrieves all reviews written by a specific user.
   * 
   * @param {string} userId The ID of the user
   * @returns {Observable<any>} An observable containing the reviews data
   */
  getUserReviewsGET(userId: string): Observable<any> {
    return this.http.get(
      `${this.url}/reviews/user/${userId}`
    ).pipe(
      tap({
        next: (response) => {
          console.log('ApiService | Successfully fetched user reviews:', response);
        },
        error: (error) => {
          console.log('ApiService | Error whilst fetching user reviews:', error.error);
        }
      })
    );
  }

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
  deleteNotificationByIdDELETE(notificationId: Types.ObjectId): Observable<any> {
    return this.http.delete(
      `${this.url}/notifications/${notificationId}`,
      { withCredentials: true }
    ).pipe(
      tap({
        next: (response) => {
          // ? Debug log
          console.log('ApiService | Successfully deleted notification:', response);
        },
        error: (error) => {
          // ? Debug log
          console.log('ApiService | Error whilst deleting notification:', error.error);
        }
      })
    );
  }


  /**
   * * PATCH Toggle Like/Dislike a Review by ID
   * 
   * Toggles a like or dislike on a review by its ID.
   */
  toggleLikeDislikeReviewPATCH(reviewId: string, userId: Types.ObjectId, action: 'like' | 'dislike' | 'unlike' | 'undislike'): Observable<any> {
    return this.http.patch(
      `${this.url}/reviews/toggle-like-dislike/${reviewId}`, 
      { userId: userId, action: action }, 
      { withCredentials: true }
    ).pipe(
      tap({
        next: (response) => {
          // ? Debug log
          console.log('ApiService | Successfully toggled like/dislike:', response);
        },
        error: (error) => {
          // ? Debug log
          console.log('ApiService | Error whilst toggling like/dislike:', error.error);
        }
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
    return this.http.get<Unit>(
      `${this.url}/units/unit/${unitcode}`
    ).pipe(
      tap({
        next: (response) => {
          // ? Debug log
          console.log('ApiService | Successfully fetched unit:', response);
        },
        error: (error) => {
          // ? Debug log
          console.log('ApiService | Error whilst fetching unit:', error.error);
        }
      })
    );
  }

  /**
   * * GET Get All Units
   * 
   * Retrieves all units.
   * 
   * @returns {Observable<Unit[]>} An observable containing an array of all units
   */
  getAllUnits(): Observable<Unit[]> {
    return this.http.get<Unit[]>(
      `${this.url}/units`
    ).pipe(
      tap({
        next: (response) => {
          // ? Debug log
          console.log('ApiService | Successfully fetched all units:', response);
        },
        error: (error) => {
          // ? Debug log
          console.log('ApiService | Error whilst fetching all units:', error.error);
        }
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
    return this.http.get<Unit[]>(
      `${this.url}/units/popular`
    ).pipe(
      tap({
        next: (response) => {
          // ? Debug log
          console.log('ApiService | Successfully fetched popular units:', response);
        },
        error: (error) => {
          // ? Debug log
          console.log('ApiService | Error whilst fetching popular units:', error.error);
        }
      })
    );
  }

  /**
   * * GET Get Units Filtered
   * 
   * Retrieves units based on the provided filters.
   * 
   * @param {number} offset The offset for pagination
   * @param {number} limit The limit for pagination
   * @param {string} [search=''] The search query for filtering units
   * @param {string} [faculty] The faculty to filter by
   * @returns {Observable<Unit[]>} An observable containing an array of filtered units
   */
  getUnitsFilteredGET(offset: number, limit: number, search: string = '', sort: string = 'Alphabetic', showReviewed?: boolean, showUnreviewed?: boolean, hideNoOfferings?: boolean, faculty?: string[], semesters?: string[], campuses?: string[]): Observable<Unit[]> {
    const params: { offset: string; limit: string; search: string; sort: string; showReviewed: string, showUnreviewed: string, hideNoOfferings: string, faculty: string[], semesters: string[], campuses: string[] } = {
      offset: offset.toString(),
      limit: limit.toString(),
      search,
      sort,
      showReviewed: 'false',
      showUnreviewed: 'false',
      hideNoOfferings: 'false',
      faculty: [],
      semesters: [],
      campuses: []
    }

    if (showReviewed) { params.showReviewed = showReviewed ? 'true' : 'false'; }
    if (showUnreviewed) { params.showUnreviewed = showUnreviewed ? 'true' : 'false'; }
    if (hideNoOfferings) { params.hideNoOfferings = hideNoOfferings ? 'true' : 'false'; }
    if (faculty) { params.faculty = faculty; }
    if (semesters) { params.semesters = semesters; }
    if (campuses) { params.campuses = campuses; }

    return this.http.get<Unit[]>(
      `${this.url}/units/filter`, 
      { params }
    ).pipe(
      tap({
        next: (response) => {
          // ? Debug log
          console.log('ApiService | Successfully fetched filtered units:', response);
        },
        error: (error) => {
          // ? Debug log
          console.log('ApiService | Error whilst fetching filtered units:', error.error);
        }
      })
    );
  }
    
  /**
   * * POST Create a Review for a Unit
   * 
   * Creates a new review for a unit.
   * 
   * @param {string} unitcode The unit code of the unit
   * @param {Review} review The review object containing review details
   * @returns {Observable<any>} An observable containing the response from the server
   */
  createReviewForUnitPOST(unitcode: string, review: Review): Observable<any> {
    return this.http.post(`${this.url}/reviews/${unitcode}/create`, { 
      review_title: review.title,
      review_semester: review.semester,
      review_grade: review.grade,
      review_year: review.year,
      review_overall_rating: review.overallRating,
      review_relevancy_rating: review.relevancyRating,
      review_faculty_rating: review.facultyRating,
      review_content_rating: review.contentRating,
      review_description: review.description,
      review_author: review.author
    }, { withCredentials: true }).pipe(
      tap({
        next: (response) => {
          // ? Debug log
          console.log('AuthService | Successfully created review:', response);
        },
        error: (error) => {
          // ? Debug log
          console.log('AuthService | Error whilst creating review:', error.error);
        }
      })
    );
  }

  /**
   * * DELETE Delete a Review by ID
   * 
   * Deletes a review by its ID.
   * 
   * @param {string} id The ID of the review
   * @returns {Observable<any>} An observable containing the response from the server
   */
  deleteReviewByIdDELETE(id: string): Observable<any> {
    return this.http.delete(
      `${this.url}/reviews/delete/${id}`
    ).pipe(
      tap({
        next: (response) => {
          // ? Debug log
          console.log('ApiService | Successfully deleted review:', response);
        },
        error: (error) => {
          // ? Debug log
          console.log('ApiService | Error whilst deleting review:', error.error);
        }
      })
    );
  }

  /**
   * * PATCH Update a Review for a unit
   * 
   * Updates a review by its ID.
   * 
   * @param {Review} review The review object containing the updated review details
   * @returns {Observable<any>} An observable containing the response from the server
   */
  editReviewPUT(review: Review): Observable<any> {
    return this.http.put(
      `${this.url}/reviews/update/${review._id}`, {
        title:            review.title,
        semester:         review.semester,
        grade:            review.grade,
        year:             review.year,
        overallRating:    review.overallRating,
        relevancyRating:  review.relevancyRating,
        facultyRating:    review.facultyRating,
        contentRating:    review.contentRating,
        description:      review.description,
      }, { withCredentials: true }).pipe(
      tap({
        next: (response) => {
          // ? Debug log
          console.log('ApiService | Successfully updated review:', response);
        },
        error: (error) => {
          // ? Debug log
          console.log('ApiService | Error whilst updating review:', error.error);
        }
      })
    );
  }

  /**
   * * POST send a report for a review
   * 
   * Sends a report for a given review
   * 
   * @param {ReportPayload} reportPayload payload containing information for the report
   */
  sendReviewReportPOST(reportPayload: ReportPayload): void {
    this.http.post(`${this.url}/reviews/send-report`,
      reportPayload,
      { withCredentials: true }).subscribe({
        next: (response) => console.log('ApiService | Successfully sent review report:', response),
        error: (error) => console.log('ApiService | Error whilst sending review report:', error)
      });
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
    return this.http.get<Unit[]>(`${this.url}/units/${unitCode}/required-by`).pipe(
      tap({
        next: (units) => {
          console.log('ApiService | Sucessfully got units requiring unit:', units);
        },
        error: (error) => {
          console.log('ApiService | Error whilst getting units requiring unit:', error.error);
        }
      })
    )
  }
}
