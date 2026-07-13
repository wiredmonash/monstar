import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  IUnit,
  IUnitDeeplyPopulated,
} from 'app/shared/models/v2/unit.schema';
import { UnitMap } from 'app/shared/models/v2/unit-map.model';
import { environment } from '../../../../environments/environment';
import { GetUnitService } from './get-unit.service';

/** Builds a minimal unit with the requisite fields the map logic reads. */
function makeUnit(overrides: Partial<IUnit>): IUnit {
  return {
    unitCode: 'fit2004',
    name: 'Algorithms and data structures',
    requisites: {
      permission: false,
      prohibitions: [],
      corequisites: [],
      prerequisites: [],
      cpRequired: 0,
    },
    ...overrides,
  } as unknown as IUnit;
}

describe('GetUnitService', () => {
  let service: GetUnitService;
  let httpMock: HttpTestingController;
  const apiV2 = environment.apiV2Url;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GetUnitService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests popular units from the v2 endpoint', () => {
    const units = [{ unitCode: 'FIT1045' }] as IUnit[];
    let result: IUnit[] | undefined;

    service.getPopularUnits().subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${apiV2}/units/popular`);
    expect(req.request.method).toBe('GET');
    req.flush(units);

    expect(result).toEqual(units);
  });

  it('reads a single unit by code from the v2 endpoint with populate params', () => {
    const unit = { unitCode: 'FIT1045' } as IUnitDeeplyPopulated;
    let result: IUnitDeeplyPopulated | undefined;

    service
      .getByUnitcode('FIT1045', true, false)
      .subscribe((res) => (result = res));

    const req = httpMock.expectOne(
      (r) => r.url === `${apiV2}/units/FIT1045`
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('populateReviews')).toBe('true');
    expect(req.request.params.get('populateReviewsAuthor')).toBe('false');
    req.flush(unit);

    expect(result).toEqual(unit);
  });

  it('requests units requiring a unit from the v2 required-by endpoint', () => {
    const units = [{ unitCode: 'FIT2004' }] as IUnit[];
    let result: IUnit[] | undefined;

    service.getUnitsRequiringUnit('FIT1045').subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${apiV2}/units/FIT1045/required-by`);
    expect(req.request.method).toBe('GET');
    req.flush(units);

    expect(result).toEqual(units);
  });

  describe('getUnitMap', () => {
    // Reads a unit then its required-by units, and returns the assembled map.
    function buildMap(unit: IUnit, parents: Partial<IUnit>[]): UnitMap {
      let result: UnitMap | undefined;
      service.getUnitMap('fit2004').subscribe((res) => (result = res));

      httpMock.expectOne((r) => r.url === `${apiV2}/units/fit2004`).flush(unit);
      httpMock.expectOne(`${apiV2}/units/fit2004/required-by`).flush(parents);

      return result!;
    }

    it('builds only the current node for a unit with no requisites and no parents', () => {
      const result = buildMap(makeUnit({ requisites: null as never }), []);

      expect(result.nodes.map((n) => n.data.type)).toEqual(['current']);
      expect(result.edges).toEqual([]);
      expect(result.prerequisiteUnitCodes).toEqual([]);
      expect(result.prerequisiteNumReq).toBe(0);
      expect(result.parentUnitCodes).toEqual([]);
    });

    it('adds prerequisite nodes and edges from prerequisite groups', () => {
      const unit = makeUnit({
        requisites: {
          permission: false,
          prohibitions: [],
          corequisites: [],
          prerequisites: [{ NumReq: 1, units: ['FIT1045', 'FIT1053'] }],
          cpRequired: 0,
        },
      });

      const result = buildMap(unit, []);

      expect(
        result.nodes
          .filter((n) => n.data.type === 'prerequisite')
          .map((n) => n.label)
      ).toEqual(['FIT1045', 'FIT1053']);
      expect(result.edges.map((e) => e.data.type)).toEqual([
        'prerequisite',
        'prerequisite',
      ]);
      expect(result.prerequisiteUnitCodes).toEqual([' FIT1045', ' FIT1053']);
      expect(result.prerequisiteNumReq).toBe(1);
    });

    it('leaves corequisites and prohibitions out of the graph', () => {
      const unit = makeUnit({
        requisites: {
          permission: false,
          prohibitions: ['FIT1040'],
          corequisites: [{ NumReq: 1, units: ['FIT2085'] }],
          prerequisites: [],
          cpRequired: 0,
        },
      });

      const result = buildMap(unit, []);

      expect(result.nodes.map((n) => n.data.type)).toEqual(['current']);
      expect(result.edges).toEqual([]);
      expect(result.prerequisiteUnitCodes).toEqual([]);
    });

    it('adds parent nodes and edges from required-by units', () => {
      const result = buildMap(makeUnit({ requisites: null as never }), [
        { unitCode: 'fit3155', name: 'Advanced algorithms' },
        { unitCode: 'fit2085', name: 'Systems' },
      ]);

      expect(
        result.nodes.filter((n) => n.data.type === 'parent').map((n) => n.label)
      ).toEqual(['FIT3155', 'FIT2085']);
      expect(result.edges.map((e) => e.data.type)).toEqual(['parent', 'parent']);
      expect(result.parentUnitCodes).toEqual([' FIT3155', ' FIT2085']);
    });
  });

  describe('hasMapData', () => {
    it('is eligible without a request when the unit has prerequisites', () => {
      const unit = makeUnit({
        unitCode: 'fit2004',
        requisites: {
          permission: false,
          prohibitions: [],
          corequisites: [],
          prerequisites: [{ NumReq: 1, units: ['FIT1045'] }],
          cpRequired: 0,
        },
      });
      let eligible: boolean | undefined;

      service.hasMapData(unit).subscribe((res) => (eligible = res));

      httpMock.expectNone(`${apiV2}/units/fit2004/required-by`);
      expect(eligible).toBe(true);
    });

    it('is eligible when required-by units exist', () => {
      const unit = makeUnit({ unitCode: 'fit1045', requisites: null as never });
      let eligible: boolean | undefined;

      service.hasMapData(unit).subscribe((res) => (eligible = res));

      httpMock
        .expectOne(`${apiV2}/units/fit1045/required-by`)
        .flush([{ unitCode: 'fit2004' }]);
      expect(eligible).toBe(true);
    });

    it('is not eligible with no prerequisites and no required-by units', () => {
      const unit = makeUnit({ unitCode: 'fit9999', requisites: null as never });
      let eligible: boolean | undefined;

      service.hasMapData(unit).subscribe((res) => (eligible = res));

      httpMock.expectOne(`${apiV2}/units/fit9999/required-by`).flush([]);
      expect(eligible).toBe(false);
    });
  });
});
