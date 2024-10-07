import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component'; 
import { FooterComponent } from '../footer/footer.component'; 

@Component({
  selector: 'app-unit-review-header',
  standalone: true,
  imports: [NavbarComponent, FooterComponent], 
  templateUrl: './unit-review-header.component.html',
  styleUrls: ['./unit-review-header.component.css'] 
})
export class UnitReviewHeaderComponent {

}
