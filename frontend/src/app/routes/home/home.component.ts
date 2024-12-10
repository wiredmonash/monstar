import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AccordionModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  // * Inject router
  constructor (private router: Router) { }

  // * Method to navigate to the unit list page
  exploreUnits() {
    this.router.navigate(['/unit-list']);
  }
}
