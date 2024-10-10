import { Component, Input } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component'; 
import { FooterComponent } from '../footer/footer.component'; 
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unit-review-header',
  standalone: true,
  imports: [NavbarComponent, FooterComponent, CommonModule], 
  templateUrl: './unit-review-header.component.html',
  styleUrls: ['./unit-review-header.component.css'] 
})
export class UnitReviewHeaderComponent {
  @Input() unit: any;
}
