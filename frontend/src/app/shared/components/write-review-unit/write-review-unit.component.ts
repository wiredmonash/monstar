import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { RatingModule } from 'primeng/rating';
import { ApiService } from '../../services/api.service';
import { Review } from '../../models/review.model';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-write-review-unit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    RatingModule,
    DropdownModule,
    ToastModule,
  ],
  providers: [
    MessageService
  ],
  templateUrl: './write-review-unit.component.html',
  styleUrl: './write-review-unit.component.scss'
})
export class WriteReviewUnitComponent {
  // Input property to receive the unit data from the parent component
  @Input() unit: any;

  // Input property to receive the visible boolean data from the parent component
  @Input() visible: boolean = false;

  // Input property to receive the current user data from the parent component
  @Input() user: User | null = null;

  // Event to notify that the review was posted
  @Output() reviewPosted = new EventEmitter<void>(); 

  // Review object and it's properties
  review: Review = new Review();

  // List of years to choose from
  yearOptions: Array<{ label: string; value: number }> = [];


  // * Constructor that initialises the year options also injects ApiService and MessageService
  constructor (
    private apiService: ApiService,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.initialiseYearOptions();
  }

  // * Opens the create review dialog
  openDialog() {
    this.visible = true;
  }

  // * Closes eate review dialog
  closeDialog() {
    this.visible = false;
  }

  /**
   * * Posts the Review (to the backend)
   * 
   * This method checks if:
   * - we are currently creating a review FOR a unit.
   * - we have default values for the review.
   * - we have valid values for the review.
   * 
   * Also calculates the overallRating using the Review model's calcOverallRating
   * helper method.
   * 
   * If all checks pass, it sends the review to the backend.
   * 
   * Pushes the review to the frontend currentUser's reviews array as well.
   * 
   * @subscribes apiService.createReviewForUnitPOST
   */
  postReview() {
    // Checking if user is logged in
    if (!this.user) {
      console.error('User data not available.');
      return;
    }

    // Checking if unit is assigned to us
    if (!this.unit) {
      console.error('Unit data not available.');
      return;
    }

    // Ensure all defaults are set in the review object
    this.review.ensureDefaults();

    // Validating values
    if (!this.review.isValid()) {
      console.error('Please fill out all fields before submitting the review, and please check your values.')
      return;
    }

    // Set review author user
    this.review.author = this.user._id;

    // Push the new review to the currentUser's reviews array
    this.user.reviews.push(this.review._id);

    // ? Debug log
    console.log('Posting review:', this.review);

    // Calculate the overall rating
    this.review.calcOverallRating();

    // Send the review using the API service
    this.apiService.createReviewForUnitPOST(this.unit.unitCode, this.review).subscribe({
      next: (response) => {
        // Create the review object from the response
        const review = new Review(
          response._id,
          response.title,
          response.semester,
          response.grade,
          response.year,
          response.overallRating,
          response.relevancyRating,
          response.facultyRating,
          response.contentRating,
          response.description,
          response.author
        )

        // Update the user's reviews array
        this.user!.reviews.push(review._id);

        // Update the current user in AuthService
        this.authService.setCurrentUser(this.user!);

        // ? Debug log
        console.log('WriteReviewUnit | Update current user:', this.user);

        // Close the pop up write review
        this.closeDialog();

        // Emit that we posted the review
        this.reviewPosted.emit();

        // Show success toast 
        this.messageService.add({ severity: 'success', summary: 'Review submitted!', detail: 'Review has been published publicly' });

        // Reset form after successful submission
        this.review = new Review();
      },
      error: (error) => { 
        // Show error toast 
        this.messageService.add({ severity: 'error', summary: 'Failed to submit review :(', detail: 'An error occurred' });
      }
    });
  }

  /**
   * * Creates the multiple previous years from current year.
   * 
   * - Pushes the values to the yearOptions array.
   * - This is used for the year dropdown option.
   * 
   * @private
   */
  private initialiseYearOptions(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 10; i--)
      this.yearOptions.push({ label: i.toString(), value: i });
  }
}
