import { Component, Input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';
import { RatingModule } from 'primeng/rating';
import { ButtonModule } from 'primeng/button';
import { UpperCasePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unit-card',
  standalone: true,
  imports: [
    CardModule, 
    FormsModule, 
    RatingModule, 
    ButtonModule,
    UpperCasePipe,
  ],
  templateUrl: './unit-card.component.html',
  styleUrls: ['./unit-card.component.scss']
})
export class UnitCardComponent {
  // Stores the data of the unit
  @Input() unit: any;

  // Injects Router
  constructor(private router: Router) { }

  /**
   * Gets the average overall rating of the unit rounded to the nearest integer.
   * 
   * @returns {number} The rounded average rating, or 0 if no reviews are available.
   */
  get averageRating(): number {
    if (this.unit?.reviews?.length) {
      const total = this.unit.reviews.reduce((sum: number, review: any) => sum + review.overallRating, 0);
      return Math.round(total / this.unit.reviews.length);
    }
    return 0; // Return 0 if no reviews are available.
  }

  // Navigates to the unit overview page for the selected unit.
  onCardClick() {
    this.router.navigate(['/unit-overview', this.unit.unitCode]);
  }
}