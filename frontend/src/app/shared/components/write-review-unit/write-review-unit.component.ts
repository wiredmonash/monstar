import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { RatingModule } from 'primeng/rating';

@Component({
  selector: 'app-write-review-unit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    RatingModule,
  ],
  templateUrl: './write-review-unit.component.html',
  styleUrl: './write-review-unit.component.scss'
})
export class WriteReviewUnitComponent {
  // Input property to receive the unit data from the parent component
  @Input() unit: any;

  // Input property to receive the visible boolean data from the parent component
  @Input() visible: boolean = false;

  // Ratings
  contentRating: Number = 0;
  relevancyRating: Number = 0; 
  facultyRating: Number = 0;

  openDialog() {
    this.visible = true;
  }

  closeDialog() {
    this.visible = false;
  }
}
