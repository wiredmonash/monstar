import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { CarouselModule } from 'primeng/carousel';
import { UnitCardComponent } from '../../shared/components/unit-card/unit-card.component';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { ApiService } from '../../shared/services/api.service';
import { SkeletonModule } from 'primeng/skeleton';
import { Unit } from '../../shared/models/unit.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

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
  popularUnits: Unit[] = [];

  // Reference to the navbar child
  @ViewChild(NavbarComponent) navbar!: NavbarComponent;

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
    private apiService: ApiService,
  ) { }

  // * Runs on init
  ngOnInit(): void {
    this.getPopularUnits();
  }

  // * Get popular units
  getPopularUnits() {
    this.loading = true;
    this.apiService.getPopularUnitsGET().subscribe({
      next: (response: Unit[]) => {
        // Map the response data to Unit objects
        this.popularUnits = response.map((unitData: any) => new Unit(
          unitData.unitCode,
          unitData.name,
          unitData.description,
          unitData.reviews,
          unitData.avgOverallRating,
          unitData.avgRelevancyRating,
          unitData.avgFacultyRating,
          unitData.avgContentRating,
          unitData.level,
          unitData.creditPoints,
          unitData.school,
          unitData.academicOrg,
          unitData.scaBand,
          unitData.requisites,
          unitData.offerings
        ));

        // Not loading anymore
        this.loading = false;

        // ? Debug log success
        console.log('Home | Popular units:', response);
      },
      error: (error) => {
        // ? Debug log error
        console.log('Home | Error getting popular units:', error.error);
      }
    })
  }

  // * Method to navigate to the unit list page
  exploreUnits() {
    this.router.navigate(['/unit-list']);
  }
}
