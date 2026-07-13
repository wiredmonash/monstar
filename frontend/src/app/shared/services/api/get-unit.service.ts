import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  FilterData,
  FilteredUnitsResponse,
} from '../../models/v2/unit.model';
import { IUnit, IUnitDeeplyPopulated } from 'app/shared/models/v2/unit.schema';

@Injectable({
  providedIn: 'root',
})
export class GetUnitService {
  private urlV2 = environment.apiV2Url;

  private http = inject(HttpClient);

  getByUnitcode(
    unitCode: string,
    populateReviews: boolean,
    populateReviewsAuthor: boolean
  ): Observable<IUnitDeeplyPopulated> {
    const params = new HttpParams()
      .set('populateReviews', populateReviews)
      .set('populateReviewsAuthor', populateReviewsAuthor);

    return this.http
      .get<IUnitDeeplyPopulated>(`${this.urlV2}/units/${unitCode}`, { params })
      .pipe(
        tap({
          next: (res) => {
            console.log('Response:', res);
          },
          error: (err) => {
            console.error('Error', err.error);
          },
        })
      );
  }

  getPopularUnits(): Observable<IUnit[]> {
    return this.http.get<IUnit[]>(`${this.urlV2}/units/popular`);
  }

  getUnitsRequiringUnit(unitCode: string): Observable<IUnit[]> {
    return this.http.get<IUnit[]>(
      `${this.urlV2}/units/${unitCode}/required-by`
    );
  }

  getUnitsFiltered({
    offset = 0,
    limit = 24,
    search = '',
    sort = 'Alphabetic',
    showReviewed = false,
    showUnreviewed = false,
    hideNoOfferings = false,
    selectedFaculties = [],
    selectedSemesters = [],
    selectedCampuses = [],
  }: FilterData): Observable<FilteredUnitsResponse> {
    let params = new HttpParams()
      .set('offset', offset.toString())
      .set('limit', limit.toString())
      .set('search', search)
      .set('sort', sort)
      .set('showReviewed', showReviewed ? 'true' : 'false')
      .set('showUnreviewed', showUnreviewed ? 'true' : 'false')
      .set('hideNoOfferings', hideNoOfferings ? 'true' : 'false');

    selectedFaculties.forEach((f) => {
      params = params.append('faculty', f);
    });
    selectedSemesters.forEach((s) => {
      params = params.append('semesters', s);
    });
    selectedCampuses.forEach((c) => {
      params = params.append('campuses', c);
    });

    return this.http.get<FilteredUnitsResponse>(`${this.urlV2}/units/filter`, {
      params,
    });
  }
}
