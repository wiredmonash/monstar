import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportReviewComponent } from './report-review.component';

describe('ReportReviewComponent', () => {
  let component: ReportReviewComponent;
  let fixture: ComponentFixture<ReportReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportReviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
