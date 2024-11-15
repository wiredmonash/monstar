import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Review } from './app/shared/models/review.model';
import { Observable } from 'rxjs';

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

  // * GET Get Unit by UnitCode
  getUnitByUnitcodeGET(unitcode: string): Observable<any> {
    return this.http.get(`${this.url}/units/${unitcode}`);
  }

  // * GET Get All Units
  getAllUnits(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/units`);
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
      review_description: review.description
    });
  }
}
