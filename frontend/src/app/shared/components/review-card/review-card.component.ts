import { SlicePipe } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-review-card',
  standalone: true,
  imports: [
    SlicePipe,
  ],
  templateUrl: './review-card.component.html',
  styleUrl: './review-card.component.scss',
})
export class ReviewCardComponent {
  // Accept review data from the parent component
  @Input() review: any; 

  // Expand state
  expanded: boolean = false;

  // Method to toggle expand/collapse state
  toggleExpand() {
    this.expanded = !this.expanded;
  }
}
