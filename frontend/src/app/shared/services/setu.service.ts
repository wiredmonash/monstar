import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Setu, SetuData } from '../models/setu.model';

@Injectable({
  providedIn: 'root',
})
export class SetuService {
  private apiUrl = environment.setuUrl;

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
}
