import { GetUnitService } from '@services/api/get-unit.service';
import { of } from 'rxjs';
import { UnitListComponent } from './unit-list.component';

describe('UnitListComponent', () => {
  it('fetches the first page again after visiting page 2', () => {
    const offsets: number[] = [];
    const unitService = jasmine.createSpyObj<GetUnitService>('GetUnitService', [
      'getUnitsFiltered',
    ]);
    unitService.getUnitsFiltered.and.callFake((filters) => {
      offsets.push(filters.offset);
      return of({ units: [], total: 100 });
    });
    // Paging only goes through the unit service.
    const component = new UnitListComponent(
      unitService,
      null!,
      null!,
      null!,
      null!
    );

    component.onPageChange({ first: 24, rows: 24 }); // page 2
    component.onPageChange({ first: 0, rows: 24 }); // back to page 1

    expect(offsets).toEqual([24, 0]);
  });
});
