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
import { environment } from '../../../../environments/environment';
import { GetUnitService } from './get-unit.service';

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
});
