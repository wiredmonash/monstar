import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component'; 
import { FooterComponent } from '../footer/footer.component'; 
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RatingModule } from 'primeng/rating';
import { WriteReviewUnitComponent } from "../write-review-unit/write-review-unit.component";
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
    ListboxModule
  ], 
  providers: [
    MessageService
  ],
  templateUrl: './unit-review-header.component.html',
  styleUrls: ['./unit-review-header.component.scss'] 
})
export class UnitReviewHeaderComponent implements OnInit, OnDestroy {
  // ViewChild to reference the WriteReviewUnitComponent
  @ViewChild(WriteReviewUnitComponent) writeReviewDialog!: WriteReviewUnitComponent;

  // Provide Math to the template
  Math = Math;

  // Receives the unit data from the parent component (UnitOverviewComponent)
  @Input() unit!: Unit;

  // Emits the sorting criteria to the parent component (UnitOverviewComponent)
  @Output() sortBy = new EventEmitter<string>();
  // Emits that the user has added a review
  @Output() reviewAdded = new EventEmitter<void>();

  // The current user
  user: User | null = null;
  userSubscription: Subscription | null = null;

  // Boolean to disable the unit map button if the unit has no prerequisites or parent units
  unitMapButtonDisabled: boolean = true;

  // The currently selected sorting option for the dropdown
  selectedSort: string = 'highest-rating';
  // Sorting options used for the dropdown
  sortOptions = [
    { name: 'Recent', value: 'recent'}, 
    { name: 'Oldest', value: 'oldest'}, 
    { name: 'Lowest Rating', value: 'lowest-rating'}, 
    { name: 'Highest Rating', value: 'highest-rating'}
  ];

  @ViewChild('sortMenu') sortMenu!: OverlayPanel;

  // Boolean to check if the user has reviewed this unit already
  hasReviewed: boolean = false;


  /**
   * === Constructor ===
   * 
   * @param {AuthService} authService - The authentication service.
   * @param {ApiService} apiService - The API service.
   * @param {MessageService} messageService - The message service.  
   * @param {Router} router - The router service.
   */
  constructor (
    private authService: AuthService,
    private apiService: ApiService,
    private messageService: MessageService,
    private router: Router
  ) { }

  /** 
   *  ! |======================================================================|
   *  ! | ANGULAR LIFECYCLE HOOKS                                              |
   *  ! |======================================================================|
   */

  /**
   * * Runs on Init
   * 
   * Subscribes to the current user observable to get the current user.
   */
  ngOnInit(): void {
    this.userSubscription = this.authService.getCurrentUser().subscribe({
      next: (currentUser: User | null) => {
        this.user = currentUser;

        // Check if the user has already reviewed this unit
        if (this.user && this.unit) {
          this.checkHasReviewed();
        }

        console.log('UnitReviewHeader | Current User:', this.user);
      }
    });

    // * Check if the unit has prerequisites or parent units
    this.unitMapButtonDisabled = this.verifyUnitGraph();
  }

  /**
   * * Runs on destroy
   */
  ngOnDestroy(): void {
    if (this.userSubscription) { this.userSubscription.unsubscribe(); }
  }

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
      this.messageService.add({ severity: 'warn', summary: 'Not Logged In!', detail: 'You must be logged in to write a review.' });
    }

    if (this.writeReviewDialog && this.user)
      this.writeReviewDialog.openDialog();
  }

  // * Emits the reviewAdded signal to be received by unit-overview component.
  handleReviewPosted() {
    this.reviewAdded.emit();
  }

  checkHasReviewed() {
    if (!this.user || !this.unit || !this.user._id) return;

    this.apiService.getUserReviewsGET(this.user._id.toString()).subscribe({
      next: (reviewsData: any) => {
        const reviews = reviewsData.map((data: ReviewData) => new Review(data));

        this.hasReviewed = reviews.some((review: Review) => {
          if (review.hasPopulatedUnit()) {
            return review.getUnitCode() === this.unit.unitCode;
          }

          return review.unit && this.unit._id && review.unit.toString() === this.unit._id.toString();
        });

        console.log(`User has ${this.hasReviewed ? 'already' : 'not yet'} reviewed this unit.`);
      },
      error: (error) => {
        console.error('UnitReviewHeader | Error whilst fetching user reviews:', error);
        // Default to false on error to allow reviews
        this.hasReviewed = false;
      }
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
  verifyUnitGraph(): boolean {
    if (this.unit!.requisites! && this.unit!.requisites!.prerequisites!) {
      console.info(`UnitReviewHeader | Unit has requisites.`);
      return this.unitMapButtonDisabled = false;
    }

    this.apiService.getUnitsRequiringUnitGET(this.unit!.unitCode).subscribe({
      next: (units) => {
        if (units.length > 0) {
          console.info('UnitReviewHeader | Unit has parent units.');
          return this.unitMapButtonDisabled = false;
        } else {
          console.warn('UnitReviewHeader | Unit has no parent units.');
          return this.unitMapButtonDisabled = true;
        }
      },
      error: (error) => {
        console.error('UnitReviewHeader | Error whilst fetching parent units:', error.error);
        return this.unitMapButtonDisabled = true;
      }
    });

    console.info('UnitReviewHeader | verifyUnitGraph false boundary case');
    return this.unitMapButtonDisabled = true;
  }

  /** 
   *  ! |======================================================================|
   *  ! | HELPERS                                                              |
   *  ! |======================================================================|
   */

  // * Navigate to the unit map page
  navigateToUnitMap() {
    this.router.navigate(['/unit-map', this.unit?.unitCode]);
  }

  /**
   * * Opens the unit handbook for this unit in a new tab
   */
  openHandbookNewTab() {
    return window.open(`https://handbook.monash.edu/2025/units/${this.unit?.unitCode}?year=${new Date().getFullYear()}`, '_blank');
  }
}
