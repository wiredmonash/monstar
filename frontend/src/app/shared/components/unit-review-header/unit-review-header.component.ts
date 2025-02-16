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
  @Input() unit: any;

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
  selectedSort: string = 'recent';
  // Sorting options used for the dropdown
  sortOptions = [
    { name: 'Recent', value: 'recent'}, 
    { name: 'Lowest Rating', value: 'lowest-rating'}, 
    { name: 'Highest Rating', value: 'highest-rating'}
  ];


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
   * * Runs on Init
   * 
   * Subscribes to the current user observable to get the current user.
   */
  ngOnInit(): void {
    this.userSubscription = this.authService.getCurrentUser().subscribe({
      next: (currentUser: User | null) => {
        this.user = currentUser;
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
   * * Handles the sorting action and emits the chosen criteria to the parent component.
   * 
   * @param {any} event - The event object containing the sorting criteria.
   */
  onSort(event: any) {
    console.log('Sorting by: ', event.value);
    this.sortBy.emit(event.value);
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

  // * Navigate to the unit map page
  navigateToUnitMap() {
    this.router.navigate(['/unit-map', this.unit?.unitCode]);
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
   * * Opens the unit handbook for this unit in a new tab
   */
  openHandbookNewTab() {
    return window.open(`https://handbook.monash.edu/2025/units/${this.unit?.unitCode}?year=${new Date().getFullYear()}`, '_blank');
  }
}
