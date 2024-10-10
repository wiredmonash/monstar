import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitReviewHeaderComponent } from './unit-review-header.component';

describe('UnitReviewHeaderComponent', () => {
  let component: UnitReviewHeaderComponent;
  let fixture: ComponentFixture<UnitReviewHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitReviewHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnitReviewHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
