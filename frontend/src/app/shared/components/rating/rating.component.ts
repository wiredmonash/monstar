import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ViewportService, ViewportType } from '../../services/viewport.service';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './rating.component.html',
  styleUrl: './rating.component.scss',
})
export class RatingComponent implements OnInit {
  // The current rating value, e.g 3.5
  @Input() rating: number = 0;
  // Total number of stars to display
  @Input() stars: number = 5;
  // Emit rating change
  @Output() ratingChange = new EventEmitter<number>();
  // Array to loop over in the template
  starsArray: number[] = [];
  // Rating on hover
  hoverRating: number = 0;
  // Viewport type
  viewportType: ViewportType = 'desktop';

  constructor(private viewportService: ViewportService) { }

  /**
   * * Initialise the stars array
   * 
   * - Create an array of length `stars` to loop over in the template
   * - Subscribes to viewport changes
   */
  ngOnInit(): void {
    this.starsArray = Array(this.stars).fill(0);

    // Subscribe to viewport changes
    this.viewportService.viewport$.subscribe(type => {
      this.viewportType = type;
    });
  }

  /**
   * * Get the type of star to display
   * 
   * Determine whether the star at index i should be "full", "half" or "empty"
   */
  getStarType(index: number): 'full' | 'half' | 'empty' {
    const starNumber = index + 1;
    const currentRating = this.hoverRating || this.rating;
    
    if (currentRating >= starNumber) { return 'full'; }
    else if (currentRating >= starNumber - 0.5) { return 'half'; }
    else { return 'empty'; }
  }

  /** 
   * * Handle touch end event
   * 
   * Determines the horizontal touch position within the star element to decide
   * if the touch is in the left half (set rating to index + 0.5) or right half.
   */
  onTouchEnd(event: TouchEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();

    const touch = event.changedTouches[0];
    const starElem = event.currentTarget as HTMLElement;
    const rect = starElem.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const starWidth = rect.width;
    const newRating = (touchX < starWidth / 2) ? index + 0.5 : index + 1;

    // Reset rating if tapping the same value
    if (Math.abs(this.rating - newRating) < 0.1) {
      this.resetRating(event);
      return;
    }

    this.rating = newRating;
    this.ratingChange.emit(newRating);
  }

  /** 
   * * Handle click event (for desktop only)
   * 
   * Determines the horizontal mouse position within the star element to decide
   * whether the click is in the left half (set rating to index + 0.5) or right half.
   */
  onStarClick(event: MouseEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();

    const starElem = event.currentTarget as HTMLElement;
    const rect = starElem.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    
    const starWidth = rect.width;
    const newRating = (clickX < starWidth / 2) ? index + 0.5 : index + 1;

    if (Math.abs(this.rating - newRating) < 0.1) {
      this.resetRating(event);
      return;
    }

    this.rating = newRating;
    this.ratingChange.emit(newRating);
  }
  
  /**
   * * Reset the rating to 0
   * 
   * Resets the rating to zero, emitting the change to the parent component.
   * This is used for the reset button.
   */
  resetRating(event: MouseEvent | TouchEvent): void {
    event.stopPropagation();
    this.rating = 0;
    this.ratingChange.emit(this.rating);
  }

  /**
   * * Handle hover over the rating container
   * 
   * Determine the horizontal mouse position within the container to decide
   * if the hover is in the left half (set hoverRating to index + 0.5) or right half
   * (index + 1)
   */
  onContainerHover(event: MouseEvent): void {
    const containerElem = event.currentTarget as HTMLElement;
    const rect = containerElem.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const starWidth = rect.width / this.stars;
    const starIndex = Math.floor(mouseX / starWidth);
    const positionInStar = mouseX % starWidth;

    this.hoverRating = (positionInStar < starWidth / 2) 
      ? starIndex + 0.5
      : starIndex + 1;
  }

  /**
   * * Handle leaving the rating container
   * 
   * Reset the hover rating to 0 when the mouse leaves the container
   */
  onContainerLeave(): void {
    this.hoverRating = 0;
  }
}
