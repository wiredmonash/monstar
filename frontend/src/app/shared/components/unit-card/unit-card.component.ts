import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';
import { RatingModule } from 'primeng/rating';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-unit-card',
  standalone: true,
  imports: [CardModule, FormsModule, RatingModule, ButtonModule],
  templateUrl: './unit-card.component.html',
  styleUrls: ['./unit-card.component.scss']
})
export class UnitCardComponent {
  rating: number = 4;

  onCardClick() {
    //Navigate to the unit
  }
}