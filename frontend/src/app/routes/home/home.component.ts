import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { CarouselModule } from 'primeng/carousel';
import { UnitCardComponent } from '../../shared/components/unit-card/unit-card.component';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    AccordionModule,
    CarouselModule,
    UnitCardComponent,
    DividerModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  popularUnits = [
    { unitCode: 'FIT1045', name: 'Introduction to Programming' },
    { unitCode: 'FIT1008', name: 'Data Structures and Algorithms' },
    { unitCode: 'FIT3171', name: 'Database' },
    { unitCode: 'FIT2095', name: 'Full-Stack Development' },
    { unitCode: 'FIT1045', name: 'Introduction to Programming' },
    { unitCode: 'FIT1008', name: 'Data Structures and Algorithms' },
    { unitCode: 'FIT3171', name: 'Database' },
    { unitCode: 'FIT2095', name: 'Full-Stack Development' },
  ];

  responsiveOptions = [
    {
      breakpoint: '1198px',
      numVisible: 2,
      numScroll: 1
    },
    {
      breakpoint: '990px',
      numVisible: 1,
      numScroll: 1
    }
  ];  

  // * Inject router
  constructor (private router: Router) { }

  // * Method to navigate to the unit list page
  exploreUnits() {
    this.router.navigate(['/unit-list']);
  }
}
