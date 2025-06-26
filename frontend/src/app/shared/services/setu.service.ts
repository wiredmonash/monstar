import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Setu, SetuData } from '../models/setu.model';

@Injectable({
  providedIn: 'root',
})
export class SetuService {
  private apiUrl = 'http://localhost:8080/api/v1/setus';

  constructor(private http: HttpClient) {}

  /**
   * Get SETU data for a specific unit
   * @param unitCode The unit code to get SETU data for
   * @returns Observable of SETU data array
   */
  getSetuByUnitCode(unitCode: string): Observable<Setu[]> {
    return this.http
      .get<SetuData[]>(`${this.apiUrl}/unit/${unitCode}`)
      .pipe(map((data) => data.map((item) => new Setu(item))));
  }

  /**
   * Get average SETU scores for a specific unit
   * @param unitCode The unit code to get average scores for
   * @returns Observable of average SETU scores
   */
  getAverageSetuScores(unitCode: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/average/${unitCode}`);
  }

  /**
   * Get SETU data for a specific season
   * @param season The season to get SETU data for (e.g., "2019_S1")
   * @returns Observable of SETU data array
   */
  getSetuBySeason(season: string): Observable<Setu[]> {
    return this.http
      .get<SetuData[]>(`${this.apiUrl}/season/${season}`)
      .pipe(map((data) => data.map((item) => new Setu(item))));
  }

  /**
   * Get all SETU data with pagination
   * @param limit Number of items per page
   * @param offset Starting offset
   * @param sort Sort criteria
   * @returns Observable of paginated SETU data
   */
  getAllSetu(
    limit: number = 50,
    offset: number = 0,
    sort: string = 'unit_code'
  ): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}?limit=${limit}&offset=${offset}&sort=${sort}`)
      .pipe(
        map((response) => ({
          ...response,
          data: response.data.map((item: SetuData) => new Setu(item)),
        }))
      );
  }
}
