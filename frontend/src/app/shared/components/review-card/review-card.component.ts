import { SlicePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../../../../api.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-review-card',
  standalone: true,
  imports: [
    SlicePipe,
    ToastModule,
  ],
  providers: [
    MessageService
  ],
  templateUrl: './review-card.component.html',
  styleUrl: './review-card.component.scss',
})
export class ReviewCardComponent implements OnInit {
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
  deleteButtonVisible: boolean = false;
  @Output() reviewDeleted = new EventEmitter<void>();

  // Injects the ApiService and MessageService 
  constructor(
    private apiService: ApiService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    // Get like and dislike count from review
    this.likes = this.review.likes;
    this.dislikes = this.review.dislikes;
    console.log('likes:', this.likes);
    console.log('dislikes:', this.dislikes);
  }

  showDeleteButton() {
    this.deleteButtonVisible = true;
  }

  hideDeleteButton() {
    this.deleteButtonVisible = false;
  }

  deleteReview() {
    // Call the api service method to delete a review
    this.apiService.deleteReviewByIdDELETE(this.review._id).subscribe({
      next: (message) => {
        // Emit the event that we deleted a review
        this.reviewDeleted.emit();

        // Show toast
        this.messageService.add({ severity: 'warn', summary: 'Review deleted!', detail: `Review: "${this.review.title}" has been deleted.` });

        // ? Debug log
        console.log(message);
      },
      error: (error) => {
        // ? Debug log 
        console.log(error);
      }
    });
  }

  // Method to toggle expand/collapse state
  toggleExpand() {
    this.expanded = !this.expanded;
  }

  // Method to toggle liked state
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

  // Method to toggle the dislike state
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

  // Call the API service method to like the review
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

  // Call the API service method to un-like the review
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

  // Call the API service method to dislike the review
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

  // Call the API service method to un-dislike the review
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
