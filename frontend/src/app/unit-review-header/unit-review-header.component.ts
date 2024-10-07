import { Component } from '@angular/core';
import { NavbarComponent } from '../shared/components/navbar/navbar.component'; 
import { FooterComponent } from '../shared/components/footer/footer.component'; 

@Component({
  selector: 'app-unit-review-header',
  standalone: true,
  imports: [NavbarComponent, FooterComponent], 
  templateUrl: './unit-review-header.component.html',
  styleUrls: ['./unit-review-header.component.css'] 
})
export class UnitReviewHeaderComponent {

}
