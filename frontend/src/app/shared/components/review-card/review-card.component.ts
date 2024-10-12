import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-review-card',
  standalone: true,
  imports: [],
  templateUrl: './review-card.component.html',
  styleUrl: './review-card.component.scss'
})
export class ReviewCardComponent {
  // Accept review data from the parent component
  @Input() review: any; 
}
