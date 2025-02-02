import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
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
import { IntegerPipe } from '../../pipes/integer.pipe';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';

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
  ], 
  providers: [
    MessageService
  ],
  templateUrl: './unit-review-header.component.html',
  styleUrls: ['./unit-review-header.component.scss'] 
})
export class UnitReviewHeaderComponent implements OnInit, OnDestroy {
  Math: any = Math

  // Input property to receive the unit data from the parent component
  @Input() unit: any;

  // Output property to emit sorting criteria to the partent component (UnitOverviewComponent)
  @Output() sortBy = new EventEmitter<string>();

  // Emits that the user has added a review
  @Output() reviewAdded = new EventEmitter<void>();

  // Our child component write-review-unit.component
  @ViewChild(WriteReviewUnitComponent) writeReviewDialog!: WriteReviewUnitComponent;

  user: User | null = null;
  userSubscription: Subscription | null = null;

  // The currently selected sorting option for the dropdown
  selectedSort: string = 'recent';
  // Sorting options used for the dropdown
  sortOptions = [
    { name: 'Recent', value: 'recent'}, 
    { name: 'Lowest Rating', value: 'lowest-rating'}, 
    { name: 'Highest Rating', value: 'highest-rating'}
  ]

  // === Injects the AuthService and MessageService ===
  constructor (
    private authService: AuthService,
    private messageService: MessageService
  ) { }

  /**
   * * Runs on Init
   */
  ngOnInit(): void {
    this.userSubscription = this.authService.getCurrentUser().subscribe({
      next: (currentUser: User | null) => {
        this.user = currentUser;
        console.log('UnitReviewHeader | Current User:', this.user);
      }
    });
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


}
