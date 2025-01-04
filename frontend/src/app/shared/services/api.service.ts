import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Review } from '../models/review.model';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // The URL of where the API Server is located
  private url = 'http://localhost:8080/api/v1';


  // ! Inject HttpClient
  constructor(private http: HttpClient) { }

  
  /**
   * * GET Get All Reviews
   * 
   * Retrieves all reviews or reviews for a specific unit if unit code is provided.
   * 
   * @param {string} [unitcode] The unit code of the unit (optional)
   * @returns {Observable<any>} An observable containing the reviews data
   */
  getAllReviewsGET(unitcode?: string): Observable<any> {
    // If the unit parameter is provided, we get all reviews by unit, if not get all the reviews.
    const url = unitcode ? `${this.url}/reviews/${unitcode}` : `${this.url}/reviews`;
    return this.http.get(url);
  }

  getUserReviewsGET(userID: string): Observable<any> {
    const url = `${this.url}/reviews/author/${userID}`;
    return this.http.get(url);
  }

  /**
   * * PATCH Like Review by ID
   * 
   * Adds a like to a review by its ID.
   * 
   * @param {string} id The ID of the review
   * @returns {Observable<any>} An observable containing the response from the server
   */
  likeReviewPATCH(id: string): Observable<any> {
    return this.http.patch(`${this.url}/reviews/like/${id}`, {});
  }

  /**
   * * PATCH Unlike Review by ID
   * 
   * Removes a like from a review by its ID.
   * 
   * @param {string} id The ID of the review
   * @returns {Observable<any>} An observable containing the response from the server
   */
  unlikeReviewPATCH(id: string): Observable<any> {
    return this.http.patch(`${this.url}/reviews/unlike/${id}`, {});
  }

  /**
   * * PATCH Dislike a Review by ID
   * 
   * Adds a dislike to a review by its ID.
   * 
   * @param {string} id The ID of the review
   * @returns {Observable<any>} An observable containing the response from the server
   */
  dislikeReviewPATCH(id: string): Observable<any> {
    return this.http.patch(`${this.url}/reviews/dislike/${id}`, {});
  }

  /**
   * * PATCH Un-Dislike a Review by ID
   * 
   * Removes a dislike from a review by its ID.
   * 
   * @param {string} id The ID of the review
   * @returns {Observable<any>} An observable containing the response from the server
   */
  undislikeReviewPATCH(id: string): Observable<any> {
    return this.http.patch(`${this.url}/reviews/undislike/${id}`, {});
  }

  /**
   * * GET Get Unit by Unitcode
   * 
   * Retrieves a unit by its unit code.
   * 
   * @param {string} unitcode The unit code of the unit
   * @returns {Observable<any>} An observable containing the unit data
   */
  getUnitByUnitcodeGET(unitcode: string): Observable<any> {
    return this.http.get(`${this.url}/units/unit/${unitcode}`);
  }

  /**
   * * GET Get All Units
   * 
   * Retrieves all units.
   * 
   * @returns {Observable<any[]>} An observable containing an array of all units
   */
  getAllUnits(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/units`);
  }

  /**
   * * GET Get Popular Units
   * 
   * Retrieves the most popular units.
   * 
   * @returns {Observable<any[]>} An observable containing an array of popular units
   */
  getPopularUnitsGET(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/units/popular`);
  }

  /**
   * * GET Get Units Filtered
   * 
   * Retrieves units based on the provided filters.
   * 
   * @param {number} offset The offset for pagination
   * @param {number} limit The limit for pagination
   * @param {string} [search=''] The search query for filtering units
   * @returns {Observable<any[]>} An observable containing an array of filtered units
   */
  getUnitsFilteredGET(offset: number, limit: number, search: string = ''): Observable<any[]> {
    const params = {
      offset: offset.toString(),
      limit: limit.toString(),
      search,
    }

    return this.http.get<any[]>(`${this.url}/units/filter`, { params });
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
    }).pipe(
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
    return this.http.delete(`${this.url}/reviews/delete/${id}`);
  }
}
