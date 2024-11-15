import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // The URL of where the API Server is located
  private url = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) { }

  // * GET Get All Reviews (optionally by Unit)
  getAllReviewsGET(unitcode?: string) {
    // If the unit parameter is provided, we get all reviews by unit, if not get all the reviews.
    const url = unitcode ? `${this.url}/reviews/${unitcode}` : `${this.url}/reviews`;
    return this.http.get(url);
  }

  // * GET Get Unit by UnitCode
  getUnitByUnitcodeGET(unitcode: string) {
    return this.http.get(`${this.url}/units/${unitcode}`);
  }

  // * GET Get All Units
  getAllUnits(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/units`);
  }
}
