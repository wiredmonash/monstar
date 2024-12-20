import { CommonModule, NgOptimizedImage, SlicePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmPopup, ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-review-card',
  standalone: true,
  imports: [
    SlicePipe,
    AvatarModule,
    CommonModule,
    ProgressSpinnerModule,
    ConfirmPopupModule,
    ButtonModule,
  ],
  providers: [
    ConfirmationService,
  ],
  templateUrl: './review-card.component.html',
  styleUrl: './review-card.component.scss',
  animations: [
    // Fade in out animation for delete button
    trigger('fadeInOut', [
      state(
        'hidden',
        style({
          opacity: 0
        })
      ),
      state(
        'visible',
        style({
          opacity: 1
        })
      ),
      transition('hidden <=> visible', animate('300ms ease-in-out'))
    ])
  ]
})
export class ReviewCardComponent implements OnInit, OnDestroy {
  // Accept review data from the parent component
  @Input() review: any; 

  // Expand state
  expanded: boolean = false;

  // Liked state
  liked: boolean = false;
  // No. of likes
  likes: number = 0;

  // Disliked state
  disliked: boolean = false;
  // No. of dislikes
  dislikes: number = 0;

  // Delete button visibility state
  deleteButtonState: 'visible' | 'hidden' = 'hidden';

  // Event emitter for when the review is deleted (used in unit overview to refresh the reviews shown)
  @Output() reviewDeleted = new EventEmitter<void>();

  // Child that is the confirmation popup on deletion
  @ViewChild(ConfirmPopup) confirmPopup!: ConfirmPopup;

  // Stores current user by subscribing to AuthService
  currentUser: User | null = null;
  // Stores the subscription for currentUser from AuthService
  private userSubscription: Subscription = new Subscription();

  // * Injects the ApiService & confirmationService
  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private confirmationService: ConfirmationService
  ) { }

  /**
   * * Runs on initialisation
   * 
   * - Sets the likes and dislikes count for the review
   */
  ngOnInit(): void {
    // Get like and dislike count from review
    this.likes = this.review.likes;
    this.dislikes = this.review.dislikes;

    // Subscribe to the current user from auth service
    this.userSubscription = this.authService.getCurrentUser().subscribe({
      next: (currentUser: User | null) => {
        this.currentUser = currentUser;

        // ? Debug log change of current user
        console.log('ReviewCard | Current User:', this.currentUser);
      }
    });
  }

  /**
   * * Runs on destroy
   * 
   * Unsubscribes from the currentUser subscription
   */
  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
  }
  

  // * Choices on confirmation popup (either delete or cancel)
  accept() { this.confirmPopup.accept(); }
  reject() { this.confirmPopup.reject(); }

  /**
   * * Subscribes to the confirmation service on deletion
   */
  confirmDeletion(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure?',
      accept: () => {
        this.deleteReview();
      },
      reject: () => { }
    });
  }

  // Deletes a review from the database using API Service
  /**
   * * Deletes a review from the DB using API Service Method
   * 
   * This deletes a review by it's MongoDB ID. If successful, it emits the 
   * reviewDeleted event so that 'unit-overview' can refresh the reviews.
   */
  deleteReview() {
    // Call the api service method to delete a review
    this.apiService.deleteReviewByIdDELETE(this.review._id).subscribe({
      next: (message) => {
        // Emit the event that we deleted a review
        this.reviewDeleted.emit();

        // ? Debug log
        console.log(message);
      },
      error: (error) => {
        // ? Debug log 
        console.log(error);
      }
    });
  }

  /**
   * * Method to toggle the expand/collapse state 
   */
  toggleExpand() {
    this.expanded = !this.expanded;
  }

  /**
   * * Toggles the liked state
   */
  like() {
    // If we have disliked and now we liked.
    if (this.disliked && !this.liked) { 
      this.disliked = false;
      this.callUnDislikeService();
      if (this.dislikes > 0)
        this.dislikes--;
    }

    // Toggle liked state
    this.liked = !this.liked;

    // ? Debugging
    console.log(`User pressed like button for review: '${this.review.title}'`)
    console.log('Like state: ', this.liked)

    // Like the review
    if (this.liked) {
      this.likes++; // Increment the likes
      this.callLikeService();
    }

    // Un-Like the review
    if (!this.liked) {
      this.likes--; // Decrement the likes
      this.callUnLikeService();
    }
  }

  /**
   * * Toggles the dislike state
   */
  dislike() {
    // if we have liked and now we disliked 
    if (this.liked && !this.disliked) { 
      this.liked = false;
      this.callUnLikeService();
      if (this.likes > 0)
        this.likes--;
    }

    // Toggle disliked state
    this.disliked = !this.disliked;

    // ? Debugging
    console.log(`User pressed dislike button for review: '${this.review.title}'`)
    console.log('Dislike state: ', this.disliked)

    // Dislike the review
    if (this.disliked) {
      this.dislikes++; // Increment the dislikes
      this.callDislikeService();
    }

    // Un-Dislike the review
    if (!this.disliked) {
      this.dislikes--; // Decrement the dislikes
      this.callUnDislikeService();
    }
  }

  // * Call the API service method to like the review
  callLikeService() {
    this.apiService.likeReviewPATCH(this.review._id).subscribe({
      next: (updatedReview) => {
        this.review.likes = updatedReview.likes;
        console.log('Review liked successfully:', updatedReview);
      },
      error: (error) => {
        console.error('Error while liking the review:', error);
      }
    });
  }

  // * Call the API service method to un-like the review
  callUnLikeService() {
    this.apiService.unlikeReviewPATCH(this.review._id).subscribe({
      next: (updatedReview) => {
        this.review.likes = updatedReview.likes;
        console.log('Review un-liked successfully:', updatedReview);
      },
      error: (error) => {
        console.error('Error while un-liking the review:', error);
      }
    });
  }

  // * Call the API service method to dislike the review
  callDislikeService() {
    this.apiService.dislikeReviewPATCH(this.review._id).subscribe({
      next: (updatedReview) => {
        this.review.dislikes = updatedReview.dislikes;
        console.log('Review disliked successfully:', updatedReview);
      },
      error: (error) => {
        console.error('Error while disliking the review:', error);
      }
    });
  }

  // * Call the API service method to un-dislike the review
  callUnDislikeService() {
    this.apiService.undislikeReviewPATCH(this.review._id).subscribe({
      next: (updatedReview) => {
        this.review.dislikes = updatedReview.dislikes;
        console.log('Review un-disliked successfully:', updatedReview);
      },
      error: (error) => {
        console.error('Error while un-disliking the review:', error);
      }
    });
  }
}
