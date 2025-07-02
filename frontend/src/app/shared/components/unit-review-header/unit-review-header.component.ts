import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RatingModule } from 'primeng/rating';
import { WriteReviewUnitComponent } from '../write-review-unit/write-review-unit.component';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '../../pipes/decimal.pipe';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { KnobModule } from 'primeng/knob';
import { RippleModule } from 'primeng/ripple';
import { Review, ReviewData } from '../../models/review.model';
import { Unit } from '../../models/unit.model';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ListboxModule } from 'primeng/listbox';
import { OverlayPanel } from 'primeng/overlaypanel';
import { ViewportService } from '../../services/viewport.service';
import { SkeletonModule } from 'primeng/skeleton';

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
    SkeletonModule
  ],
  providers: [MessageService],
  templateUrl: './unit-review-header.component.html',
  styleUrls: ['./unit-review-header.component.scss'],
})
export class UnitReviewHeaderComponent implements OnInit, OnDestroy, OnChanges {
  // ViewChild to reference the WriteReviewUnitComponent
  @ViewChild(WriteReviewUnitComponent)
  writeReviewDialog!: WriteReviewUnitComponent;

  // Provide Math to the template
  Math = Math;

  // Receives the unit data from the parent component (UnitOverviewComponent)
  @Input() unit?: Unit;

  // Emits the sorting criteria to the parent component (UnitOverviewComponent)
  @Output() sortBy = new EventEmitter<string>();
  // Emits that the user has added a review
  @Output() reviewAdded = new EventEmitter<void>();

  // The current user
  user: User | null = null;
  userSubscription: Subscription | null = null;

  // Boolean to disable the unit map button if the unit has no prerequisites or parent units
  isUnitMapButtonEnabled: boolean = true;

  // The currently selected sorting option for the dropdown
  selectedSort: string = 'highest-rating';
  // Sorting options used for the dropdown
  sortOptions = [
    { name: 'Recent', value: 'recent' },
    { name: 'Oldest', value: 'oldest' },
    { name: 'Lowest Rating', value: 'lowest-rating' },
    { name: 'Highest Rating', value: 'highest-rating' },
    { name: 'Most Likes', value: 'most-likes' },
    { name: 'Most Dislikes', value: 'most-dislikes' },
  ];

  @ViewChild('sortMenu') sortMenu!: OverlayPanel;

  // Boolean to check if the user has reviewed this unit already
  hasReviewed: boolean = false;

  // Stores the viewport type given from the viewport service
  viewportType: string = 'desktop';

  // Skeleton height for the header when it's loading (pixels)
  private readonly SKELETON_HEIGHTS = {
    mobile: '606px',
    tablet: '431.6px',
    laptop: '273.2px',
    desktop: '438px'
  }
  skeletonHeight: string = this.SKELETON_HEIGHTS.desktop;

  // Resize handler for skeleton heights
  private resizeHandler = () => this.updateSkeletonHeight();

  /**
   * === Constructor ===
   *
   * @param {AuthService} authService - The authentication service.
   * @param {ApiService} apiService - The API service.
   * @param {MessageService} messageService - The message service.
   * @param {Router} router - The router service.
   */
  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private messageService: MessageService,
    private router: Router,
    private viewportService: ViewportService
  ) {}

  /**
   *  ! |======================================================================|
   *  ! | ANGULAR LIFECYCLE HOOKS                                              |
   *  ! |======================================================================|
   */

  /**
   * ! Runs on Init
   *
   * Subscribes to the current user observable to get the current user.
   */
  ngOnInit(): void {
    // Subscribe to the ucrrent user
    this.userSubscription = this.authService.getCurrentUser().subscribe({
      next: (currentUser: User | null) => {
        this.user = currentUser;

        // Check if the user has already reviewed this unit
        if (this.user && this.unit) {
          this.checkHasReviewed();
        }

        console.log('UnitReviewHeader | Current User:', this.user);
      },
    });

    // Subscribe to the viewport service and get the viewport type
    this.viewportService.viewport$.subscribe((type) => {
      this.viewportType = type;
    });
  }

  /**
   * ! Runs after view has initialised
   */
  ngAfterViewInit(): void {
    // Resize listener to update the skeleton height
    this.updateSkeletonHeight();
    window.addEventListener('resize', this.resizeHandler);

    // Check if the unit has prerequisites or parent units
    if (this.unit) {
      this.isUnitMapButtonEnabled = this.unitHasRequisites();
    }
  }

  /**
   * ! Runs on changes
   * 
   * Verifies the unit graph again on changes of the `unit` variable.
   */
  ngOnChanges(changes: SimpleChanges): void {
    /**
     * Check if:
     * 1. The 'unit' property has changed.
     * 2. AND the new value is not null/undefined.
     * 3. AND EITHER:
     *  a. There was no previous value (first time the unit is set)
     *  b. OR the unit code has changed (it's a different unit)
     */
    if (changes['unit'] && changes['unit'].currentValue &&
      (!changes['unit'].previousValue ||
        changes['unit'].currentValue.unitCode !== changes['unit'].previousValue.unitCode)) {
      this.isUnitMapButtonEnabled = this.unitHasRequisites();
    }
  }

  /**
   * ! Runs on destroy
   * 
   * - Removes the resize event listener to prevent memory leaks.
   * - Unsubscribes from the user subscription.
   */
  ngOnDestroy(): void {
    // Destroy the resize listener
    window.removeEventListener('resize', this.resizeHandler);

    // Unsubscribe to the current user
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  /**
   *  ! |======================================================================|
   *  ! | VALIDATION                                                           |
   *  ! |======================================================================|
   */

  /**
   * * Checks if a user has already reviewed this unit
   *
   * It will call the "GET Get User Reviews" API endpoint and check if the user
   * has reviewed this unit.
   *
   * @subscribes getUserReviewsGET()
   */
  checkHasReviewed() {
    if (!this.user || !this.unit || !this.user._id) return;

    const user = this.user;
    const unit = this.unit;

    // Get the users reviews
    this.apiService.getUserReviewsGET(user._id.toString()).subscribe({
      next: (reviewsData: any) => {
        const reviews = reviewsData.map((data: ReviewData) => new Review(data));
        
        // Check if user has reviewed this unit
        this.hasReviewed = reviews.some((userReview: Review) => {
          if (userReview.hasPopulatedUnit()) {
            return userReview.getUnitCode() === unit.unitCode;
          }

          return (
            userReview.unit &&
            unit._id &&
            userReview.unit.toString() === unit._id.toString()
          );
        });

        console.log(
          `User has ${
            this.hasReviewed ? 'already' : 'not yet'
          } reviewed this unit.`
        );
      },
      error: (error) => {
        console.error(
          'UnitReviewHeader | Error whilst fetching user reviews:',
          error
        );
        // Default to false on error to allow reviews
        this.hasReviewed = false;
      },
    });
  }

  /**
   * * Check if unit has prerequisites and/or parent units
   *
   * This checks if the unit has prerequisites or parent units by checking the unit object.
   * - If the unit object doesn't have prerequisites, the unit map button is disabled.
   * - If the unit object doesn't have parent units, the unit map button is disabled.
   *
   * @returns {boolean} Returns true if the unit has prerequisites or parent units, false otherwise.
   */
  unitHasRequisites(): boolean {
    if (!this.unit || !this.unit.unitCode) return false;

    if (
      this.unit?.requisites?.prerequisites &&
      this.unit.requisites.prerequisites.length > 0
    ) {
      console.info(`UnitReviewHeader | Unit has requisites.`);
      return true;
    }

    this.apiService.getUnitsRequiringUnitGET(this.unit.unitCode).subscribe({
      next: (units) => {
        if (units.length > 0) {
          console.info('UnitReviewHeader | Unit has parent units.');
          this.isUnitMapButtonEnabled = true;
        } else {
          console.warn('UnitReviewHeader | Unit has no parent units.');
          this.isUnitMapButtonEnabled = false;
        }
      },
      error: (error) => {
        console.error('UnitReviewHeader | Error whilst fetching parent units:', error.error);
        this.isUnitMapButtonEnabled = false;
      }
    });

    return false;
  }

  /**
   *  ! |======================================================================|
   *  ! | UI MANIPULATORS                                     
   *  ! |======================================================================|
   */

  private updateSkeletonHeight() { 
    const width = window.innerWidth;
    let height = this.SKELETON_HEIGHTS.desktop;

    if (width < 768) { height = this.SKELETON_HEIGHTS.mobile; }
    else if (width < 976) { height = this.SKELETON_HEIGHTS.tablet; }
    else if (width < 1414) { height = this.SKELETON_HEIGHTS.laptop; }

    this.skeletonHeight = height;
  }

  /**
   *  ! |======================================================================|
   *  ! | HELPERS                                                              |
   *  ! |======================================================================|
   */

  /**
   * * Handles the dropdown toggle action.
   */
  toggleDropdown(event: Event) {
    this.sortMenu.toggle(event);
  }

  /**
   * * Handles the sorting action and emits the chosen criteria to the parent component.
   *
   * @param {any} event - The event object containing the sorting criteria.
   */
  onSort(event: any) {
    console.log('Sorting by: ', event.value);
    this.sortBy.emit(event.value);

    // Closes the dropdown menu after selection
    this.sortMenu.hide();
  }

  // * Shows the dialog to write a review
  showDialog() {
    if (this.user == null) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Not Logged In!',
        detail: 'You must be logged in to write a review.',
      });
    }

    if (this.writeReviewDialog && this.user)
      this.writeReviewDialog.openDialog();
  }

  // * Emits the reviewAdded signal to be received by unit-overview component.
  handleReviewPosted() {
    this.reviewAdded.emit();
  }

  // * Navigate to the unit map page
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
