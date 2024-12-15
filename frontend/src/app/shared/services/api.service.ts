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

  constructor(private http: HttpClient) { }

  // * GET Get All Reviews (optionally by Unit)
  getAllReviewsGET(unitcode?: string): Observable<any> {
    // If the unit parameter is provided, we get all reviews by unit, if not get all the reviews.
    const url = unitcode ? `${this.url}/reviews/${unitcode}` : `${this.url}/reviews`;
    return this.http.get(url);
  }

  // * PATCH Like Review by ID
  likeReviewPATCH(id: string): Observable<any> {
    return this.http.patch(`${this.url}/reviews/like/${id}`, {});
  }

  // * PATCH Un-Like Review by ID
  unlikeReviewPATCH(id: string): Observable<any> {
    return this.http.patch(`${this.url}/reviews/unlike/${id}`, {});
  }

  // * PATCH Dislike a Review by ID
  dislikeReviewPATCH(id: string): Observable<any> {
    return this.http.patch(`${this.url}/reviews/dislike/${id}`, {});
  }

  // * PATCH Un-Dislike a Review by ID
  undislikeReviewPATCH(id: string): Observable<any> {
    return this.http.patch(`${this.url}/reviews/undislike/${id}`, {});
  }

  // * GET Get Unit by Unitcode
  getUnitByUnitcodeGET(unitcode: string): Observable<any> {
    return this.http.get(`${this.url}/units/unit/${unitcode}`);
  }

  // * GET Get All Units
  getAllUnits(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/units`);
  }

  // * GET Get Popular Units
  getPopularUnitsGET(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/units/popular`);
  }

  // * GET Get Units Filtered
  getUnitsFilteredGET(offset: number, limit: number, search: string = ''): Observable<any[]> {
    const params = {
      offset: offset.toString(),
      limit: limit.toString(),
      search,
    }

    return this.http.get<any[]>(`${this.url}/units/filter`, { params });
  }
    
  // * POST Create a Review for a Unit
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

  // * DELETE Delete a Review by ID
  deleteReviewByIdDELETE(id: string): Observable<any> {
    return this.http.delete(`${this.url}/reviews/delete/${id}`);
  }
}
