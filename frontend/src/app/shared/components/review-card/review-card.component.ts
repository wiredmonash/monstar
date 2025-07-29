import { CommonModule, NgOptimizedImage, SlicePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
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
import { TooltipModule } from 'primeng/tooltip';
import { ReportReviewComponent } from './report-review/report-review.component';
import { ViewportService, ViewportType } from '../../services/viewport.service';
import { BadgeModule } from 'primeng/badge';
import { HighlightUnitPipe } from '../../pipes/highlight-unit.pipe';

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
    TooltipModule,
    ReportReviewComponent,
    BadgeModule,
    HighlightUnitPipe
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
  // Report dialog component
  private _reportReviewDialog!: ReportReviewComponent;

  // Providing to template
  Math = Math;
  console = console;

  // Accept review data from the parent component
  @Input() review: any; 

  // Event emitter for when the review is deleted (used in unit overview to refresh the reviews shown)
  @Output() reviewDeleted = new EventEmitter<void>();

  // Child that is the confirmation popup on deletion
  @ViewChild(ConfirmPopup) confirmPopup!: ConfirmPopup;

  // Child component: report review dialog
  @ViewChild(ReportReviewComponent)
  set reportReviewDialog(content: ReportReviewComponent) {
    if (content) {
      this._reportReviewDialog = content;
    }
  }
  get reportReviewDialog(): ReportReviewComponent {
    return this._reportReviewDialog;
  }
  
  // Expand state
  expanded: boolean = false;

  // Liking
  liked: boolean = false;
  hoveringLike: boolean = false;
  likes: number = 0;
  // Disliking
  disliked: boolean = false;
  hoveringDislike: boolean = false;
  dislikes: number = 0;

  // Delete button visibility state
  deleteButtonState: 'visible' | 'hidden' = 'hidden';

  // Current user
  currentUser: User | null = null;
  private userSubscription: Subscription = new Subscription();

  // Viewport type
  viewportType: ViewportType = 'desktop';



  /**
   * ! Constructor 
   *
   */
  constructor (
    private apiService: ApiService,
    private authService: AuthService,
    private confirmationService: ConfirmationService,
    private viewportService: ViewportService
  ) { }



  /** 
   * ! |=======================================================================|
   * ! | LIFECYCLE HOOKS                                                       |
   * ! |=======================================================================|
   */

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
        // Store the current user for this component
        this.currentUser = currentUser;

        // Set the liked and disliked state of the review
        this.liked = this.currentUser?.likedReviews.includes(this.review._id) || false;
        this.disliked = this.currentUser?.dislikedReviews.includes(this.review._id) || false;

        // ? Debug log change of current user
        // console.log('ReviewCard | Current User:', this.currentUser);
      }
    });

    // Subscribe to viewport changes
    this.viewportService.viewport$.subscribe(type => {
      this.viewportType = type;
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



  /** 
   * ! |=======================================================================|
   * ! | REVIEW DELETION                                                       |
   * ! |=======================================================================|
   */
  
  /** 
   * * Choices on confirmation popup (either delete or cancel)
   */
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

        // Remove this review from the current user's reviews array
        this.currentUser?.reviews.splice(this.currentUser.reviews.indexOf(this.review._id), 1); 

        // ? Debug log
        // console.log(message);
      },
      error: (error) => {
        // ? Debug log 
        // console.log(error);
      }
    });
  }



  /** 
   * ! |=======================================================================|
   * ! | LIKING AND DISLIKING                                                  |
   * ! |=======================================================================|
   */

  /**
   * * Method to toggle the like state
   */
  toggleLike() {
    if (!this.currentUser) return;
    if (this.currentUser._id === this.review.author._id) return;

    this.apiService.toggleReactionPATCH(
      this.review._id, 
      this.currentUser._id.toString(), 
      'like'
    ).subscribe({
      next: (response: any) => {
        this.review.likes = response.review.likes;
        this.review.dislikes = response.review.dislikes;
        
        // Update reaction states based on server response
        this.liked = response.reactions.liked;
        this.disliked = response.reactions.disliked;

        // Update the user's liked/disliked reviews lists
        if (this.liked) {
          this.currentUser?.addLikedReview(this.review._id);
          
          if (this.disliked) {
            this.currentUser?.removeDislikedReview(this.review._id);
          }
        } else {
          this.currentUser?.removeLikedReview(this.review._id);
        }

        // console.log(`Review like toggled successfully:`, response);
      },
      error: (error) => {
        // console.error('Error while toggling like:', error);
      }
    });
  }

  /**
   * * Method to toggle the dislike state
   */
  toggleDislike() {
    if (!this.currentUser) return;
    if (this.currentUser._id === this.review.author._id) return;

    this.apiService.toggleReactionPATCH(
      this.review._id, 
      this.currentUser._id.toString(), 
      'dislike'
    ).subscribe({
      next: (response) => {
        this.review.likes = response.review.likes;
        this.review.dislikes = response.review.dislikes;
        
        // Update reaction states based on server response
        this.liked = response.reactions.liked;
        this.disliked = response.reactions.disliked;
        
        if (this.disliked) {
          this.currentUser?.addDislikedReview(this.review._id);
          
          if (this.liked) {
            this.currentUser?.removeLikedReview(this.review._id);
          }
        } else {
          this.currentUser?.removeDislikedReview(this.review._id);
        }

        // console.log(`Review dislike toggled successfully:`, response);
      },
      error: (error) => {
        // console.error('Error while toggling dislike:', error);
      }
    });
  }



  /** 
   * ! |=======================================================================|
   * ! | HELPER METHODS                                                        |
   * ! |=======================================================================|
   */

  /**
   * * Method to toggle the expand/collapse state
   */
  toggleExpand() {
    this.expanded = !this.expanded;
  }

  /**
   * * Shows dialog to report review
   */
  showReportDialog() {
    if (this.currentUser && this.reportReviewDialog) {
      this.reportReviewDialog.openDialog();
    }
  }
}
