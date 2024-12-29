import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { CarouselModule } from 'primeng/carousel';
import { UnitCardComponent } from '../../shared/components/unit-card/unit-card.component';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { ApiService } from '../../shared/services/api.service';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    AccordionModule,
    CarouselModule,
    UnitCardComponent,
    DividerModule,
    ButtonModule,
    SkeletonModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  // Loading status of popular units fetching
  loading: boolean = true;

  // Stores the popular units to be displayed on the home page
  popularUnits: any = [];

  // Carousel responsive options
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

  // * Inject Router & ApiService
  constructor (
    private router: Router,
    private apiService: ApiService
  ) { }

  // * Runs on init
  ngOnInit(): void {
    this.getPopularUnits();
  }

  // * Get popular units
  getPopularUnits() {
    this.loading = true;
    this.apiService.getPopularUnitsGET().subscribe({
      next: (response: any) => {
        this.loading = false;
        this.popularUnits = response;
        console.log('Home | Popular units:', response);
      },
      error: (error) => {
        console.log('Home | Error getting popular units:', error.error);
      }
    })
  }

  // * Method to navigate to the unit list page
  exploreUnits() {
    this.router.navigate(['/unit-list']);
  }
}
