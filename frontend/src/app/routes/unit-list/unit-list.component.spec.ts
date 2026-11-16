import { ApplicationRef, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GetUnitService } from '@services/api/get-unit.service';
import { of } from 'rxjs';
import { UnitListComponent } from './unit-list.component';

describe('UnitListComponent', () => {
  let unitService: jasmine.SpyObj<GetUnitService>;
  let component: UnitListComponent;

  beforeEach(() => {
    unitService = jasmine.createSpyObj<GetUnitService>('GetUnitService', [
      'getUnitsFiltered',
    ]);
    unitService.getUnitsFiltered.and.returnValue(of({ units: [], total: 100 }));
    component = new UnitListComponent(
      unitService,
      null!,
      null!,
      null!,
      null!,
      TestBed.inject(Injector)
    );
  });

  it('fetches the first page again after visiting page 2', () => {
    const offsets: number[] = [];
    unitService.getUnitsFiltered.and.callFake((filters) => {
      offsets.push(filters.offset);
      return of({ units: [], total: 100 });
    });

    component.onPageChange({ first: 24, rows: 24 });
    component.onPageChange({ first: 0, rows: 24 });

    expect(offsets).toEqual([24, 0]);
  });

  it('slides back to the top once the page change has rendered', () => {
    const navbar = document.body.appendChild(document.createElement('nav'));
    navbar.className = 'navbar';
    const animate = spyOn(navbar, 'animate');
    spyOnProperty(window, 'scrollY').and.returnValue(500);
    const scrollTo = spyOn<any>(window, 'scrollTo');

    component.onPageChange({ first: 24, rows: 24 });
    expect(scrollTo).not.toHaveBeenCalled();
    TestBed.inject(ApplicationRef).tick();
    navbar.remove();

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
    expect(animate).toHaveBeenCalledWith(
      [{ transform: 'translateY(-500px)' }, { transform: 'none' }],
      jasmine.objectContaining({ duration: 400 })
    );
  });
});
