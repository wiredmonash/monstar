import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  FilterData,
  FilteredUnitsResponse,
} from '../../models/v2/unit.model';
import {
  UnitMap,
  UnitMapEdge,
  UnitMapNode,
} from '../../models/v2/unit-map.model';
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

  /**
   * Reads a unit and the units that require it, then assembles the graph nodes,
   * edges, and sidebar fields the unit map renders.
   */
  getUnitMap(unitCode: string): Observable<UnitMap> {
    return this.getByUnitcode(unitCode, false, false).pipe(
      switchMap((unit) =>
        this.getUnitsRequiringUnit(unit.unitCode).pipe(
          map((parents) => this.assembleUnitMap(unit, parents))
        )
      )
    );
  }

  /**
   * Whether a unit qualifies for a map: it has prerequisites, or other units
   * require it. Only fetches required-by units when there are no prerequisites.
   */
  hasMapData(unit: IUnit): Observable<boolean> {
    if (this.flattenPrerequisiteCodes(unit).length > 0) return of(true);

    return this.getUnitsRequiringUnit(unit.unitCode).pipe(
      map((parents) => parents.length > 0)
    );
  }

  private flattenPrerequisiteCodes(unit: IUnit): string[] {
    return (unit.requisites?.prerequisites ?? []).flatMap(
      (group) => group.units
    );
  }

  private assembleUnitMap(unit: IUnit, parents: IUnit[]): UnitMap {
    const currentNode: UnitMapNode = {
      id: unit.unitCode,
      label: unit.unitCode.toUpperCase(),
      data: { type: 'current', name: unit.name },
    };

    const prereqNodes: UnitMapNode[] = this.flattenPrerequisiteCodes(unit).map(
      (code) => ({
        id: code,
        label: code.toUpperCase(),
        data: { type: 'prerequisite', name: code },
      })
    );
    const prereqEdges: UnitMapEdge[] = prereqNodes.map((node) => ({
      id: `${node.id}-${currentNode.id}`,
      source: node.id,
      target: currentNode.id,
      data: { type: 'prerequisite' },
    }));

    const parentNodes: UnitMapNode[] = parents.map((parent) => ({
      id: parent.unitCode,
      label: parent.unitCode.toUpperCase(),
      data: { type: 'parent', name: parent.name },
    }));
    const parentEdges: UnitMapEdge[] = parentNodes.map((node) => ({
      id: `${currentNode.id}-${node.id}`,
      source: currentNode.id,
      target: node.id,
      data: { type: 'parent' },
    }));

    return {
      unit,
      nodes: [currentNode, ...prereqNodes, ...parentNodes],
      edges: [...prereqEdges, ...parentEdges],
      prerequisiteUnitCodes: prereqNodes.map((node) => ' ' + node.label),
      prerequisiteNumReq: unit.requisites?.prerequisites?.[0]?.NumReq ?? 0,
      parentUnitCodes: parentNodes.map((node) => ' ' + node.label),
    };
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
