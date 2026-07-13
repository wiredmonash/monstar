import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '@services/api/user.service';
import { ICreateReview } from 'app/shared/models/v2/review.schema';
import { IUnitDeeplyPopulated } from 'app/shared/models/v2/unit.schema';
import { IUser } from 'app/shared/models/v2/user.schema';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { KnobModule } from 'primeng/knob';
import { ListboxModule } from 'primeng/listbox';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { RatingModule } from 'primeng/rating';
import { RippleModule } from 'primeng/ripple';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { combineLatest, map, ReplaySubject } from 'rxjs';
import { DecimalPipe } from '../../pipes/decimal.pipe';
import { GetUnitService } from '../../services/api/get-unit.service';
import { ViewportService } from '../../services/viewport.service';
import { WriteReviewUnitComponent } from '../write-review-unit/write-review-unit.component';

@Component({
  selector: 'app-unit-review-header',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    RatingModule,
    WriteReviewUnitComponent,
    DropdownModule,
    FormsModule,
    DecimalPipe,
    ToastModule,
    DividerModule,
    TooltipModule,
    KnobModule,
    RippleModule,
    OverlayPanelModule,
    ListboxModule,
    SkeletonModule,
  ],
  providers: [MessageService],
  templateUrl: './unit-review-header.component.html',
  styleUrls: ['./unit-review-header.component.scss'],
})
export class UnitReviewHeaderComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild(WriteReviewUnitComponent)
  writeReviewDialog!: WriteReviewUnitComponent;

  Math = Math;

  readonly unit$ = new ReplaySubject<IUnitDeeplyPopulated>(1);
  private _unit!: IUnitDeeplyPopulated;
  @Input({ required: true })
  set unit(value: IUnitDeeplyPopulated) {
    this._unit = value;
    this.unit$.next(value);
  }
  get unit() {
    return this._unit;
  }

  @Output() sortBy = new EventEmitter<string>();
  @Output() reviewAdded = new EventEmitter<ICreateReview>();

  isUnitMapButtonEnabled: boolean = true;

  selectedSort: string = 'highest-rating';
  sortOptions = [
    { name: 'Recent', value: 'recent' },
    { name: 'Oldest', value: 'oldest' },
    { name: 'Lowest Rating', value: 'lowest-rating' },
    { name: 'Highest Rating', value: 'highest-rating' },
    { name: 'Most Likes', value: 'most-likes' },
    { name: 'Most Dislikes', value: 'most-dislikes' },
  ];
  @ViewChild('sortMenu') sortMenu!: OverlayPanel;

  viewportType: string = 'desktop';

  // Skeleton height for the header when it's loading (pixels)
  private readonly SKELETON_HEIGHTS = {
    mobile: '606px',
    tablet: '431.6px',
    laptop: '273.2px',
    desktop: '438px',
  };
  skeletonHeight: string = this.SKELETON_HEIGHTS.desktop;
  private resizeHandler = () => this.updateSkeletonHeight();

  private userService = inject(UserService);
  private getUnitService = inject(GetUnitService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private viewportService = inject(ViewportService);

  readonly userState$ = combineLatest([
    this.userService.currentUser$,
    this.unit$,
  ]).pipe(
    map(([user, unit]) => {
      const state: {
        user: IUser | null;
        hasReviewed: boolean;
        isLoading: boolean;
      } = {
        user: null,
        hasReviewed: false,
        isLoading: true,
      };
      if (!user) return state;
      if (!unit) return state;

      state.hasReviewed = user
        ? !!unit.reviews.find((r) => r.author?._id === user._id)
        : false;
      state.user = user;
      state.isLoading = false;

      return state;
    })
  );

  ngOnInit(): void {
    this.viewportService.viewport$.subscribe((type) => {
      this.viewportType = type;
    });
  }

  ngAfterViewInit(): void {
    // Resize listener to update the skeleton height
    this.updateSkeletonHeight();
    window.addEventListener('resize', this.resizeHandler);

    // Check if the unit has prerequisites or parent units
    if (this.unit) {
      this.evaluateMapEligibility();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    /**
     * Check if:
     * 1. The 'unit' property has changed.
     * 2. AND the new value is not null/undefined.
     * 3. AND EITHER:
     *  a. There was no previous value (first time the unit is set)
     *  b. OR the unit code has changed (it's a different unit)
     */
    if (
      changes['unit'] &&
      changes['unit'].currentValue &&
      (!changes['unit'].previousValue ||
        changes['unit'].currentValue.unitCode !==
          changes['unit'].previousValue.unitCode)
    ) {
      this.evaluateMapEligibility();
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
  }

  /* ------------------------------- Validation ------------------------------- */

  /**
   * * Evaluate whether the unit qualifies for a map
   *
   * Asks the unit module whether the unit has prerequisites or is required by
   * other units, and enables or disables the unit map button accordingly.
   */
  evaluateMapEligibility(): void {
    if (!this.unit) {
      this.isUnitMapButtonEnabled = false;
      return;
    }

    this.getUnitService.hasMapData(this.unit).subscribe({
      next: (eligible) => {
        this.isUnitMapButtonEnabled = eligible;
      },
      error: (error) => {
        console.error(
          'UnitReviewHeader | Error whilst checking map eligibility:',
          error.error
        );
        this.isUnitMapButtonEnabled = false;
      },
    });
  }

  /* ----------------------------- UI manipulation ---------------------------- */

  private updateSkeletonHeight() {
    const width = window.innerWidth;
    let height = this.SKELETON_HEIGHTS.desktop;

    if (width < 768) {
      height = this.SKELETON_HEIGHTS.mobile;
    } else if (width < 976) {
      height = this.SKELETON_HEIGHTS.tablet;
    } else if (width < 1414) {
      height = this.SKELETON_HEIGHTS.laptop;
    }

    this.skeletonHeight = height;
  }

  /* --------------------------------- Helpers -------------------------------- */

  toggleDropdown(event: Event) {
    this.sortMenu.toggle(event);
  }

  onSort(event: any) {
    console.log('Sorting by: ', event.value);
    this.sortBy.emit(event.value);

    // Closes the dropdown menu after selection
    this.sortMenu.hide();
  }

  showDialog() {
    const user = this.userService.currentUserValue;
    if (user == null) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Not Logged In!',
        detail: 'You must be logged in to write a review.',
      });
    }

    if (this.writeReviewDialog && user) {
      this.writeReviewDialog.openDialog();
    } else {
      console.error('Could not open dialog for some reason');
    }
  }

  navigateToUnitMap() {
    this.router.navigate(['/map', this.unit?.unitCode]);
  }

  /**
   * * Opens the unit handbook for this unit in a new tab
   */
  openHandbookNewTab() {
    return window.open(
      `https://handbook.monash.edu/2025/units/${
        this.unit?.unitCode
      }?year=${new Date().getFullYear()}`,
      '_blank'
    );
  }
}
