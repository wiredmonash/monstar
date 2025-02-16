import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

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

  /**
   * * Initialise the stars array
   * 
   * Create an array of length `stars` to loop over in the template
   */
  ngOnInit(): void {
    this.starsArray = Array(this.stars).fill(0);
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
   * * Handle a click on star at index i
   * 
   * Determine the horizontal click position within the star element to decide
   * if the click was in the left half (set rating to index + 0.5) or right half
   * (index + 1)
  */
  onStarClick(event: MouseEvent, index: number): void {
    const starElem = event.currentTarget as HTMLElement;
    const rect = starElem.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const starWidth = rect.width;
    // If click is in the left half, then select a half star; otherwise, full star.
    const newRating = (clickX < starWidth / 2) ? index + 0.5 : index + 1;
    this.rating = newRating;
    this.ratingChange.emit(newRating);
  }

  /**
   * * Reset the rating to 0
   * 
   * Resets the rating to zero, emitting the change to the parent component.
   * This is used for the reset button.
   */
  resetRating(event: MouseEvent) {
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
