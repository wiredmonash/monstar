import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { trigger, state, style, animate, transition } from '@angular/animations';
import { RatingComponent } from '../../shared/components/rating/rating.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    AccordionModule,
    CarouselModule,
    UnitCardComponent,
    DividerModule,
    ButtonModule,
    SkeletonModule,
  ],
  animations: [
    // * Animation for subheader text fade in/out
    trigger('fadeInOut', [
      state('in', style({ opacity: 1 })),
      state('out', style({ opacity: 0 })),
      transition('in => out', animate('500ms ease-out')),
      transition('out => in', animate('500ms ease-in'))
    ])
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  // Loading status of popular units fetching
  loading: boolean = true;

  // Stores the popular units to be displayed on the home page
  popularUnits: Unit[] = [];

  // Reference to the navbar child
  @ViewChild(NavbarComponent) navbar!: NavbarComponent;

  myRating: number = 0;

  // Subheader variables
  subheaders: string[] = [
    'Browse, Review, and Share Feedback on Monash University Units', 
    'Find the Best Units for Your Degree!', 
    'Hmmm, what units should I take next semester?',
    'Discover the best units at Monash University',
    'Rate and review your favourite units!',
    "What's a WAM booster?",
    'What unit should I do bro?',
    'Yes, we have all the units you need!'
  ];
  subheaderCurrentIndex: number = 0;
  subheaderState: 'in' | 'out' = 'in';
  subheaderChangeSeconds: number = 5;
  subheaderChangeSecondsBuffer: number = 0.5;
  private intervalId: any; // The ID of the interval used for deletion

  // Carousel responsive options (for resizing the popular units carousel)
  responsiveOptions = [
    {
      breakpoint: '1400px',
      numVisible: 2,
      numScroll: 1
    },
    {
      breakpoint: '990px',
      numVisible: 1,
      numScroll: 1
    }
  ];  

  /**
   * * Constructor
   * 
   * @param router Angular router
   * @param apiService API service for making HTTP requests
   */
  constructor (
    private router: Router,
    private apiService: ApiService,
  ) { }

  /**
   * * Runs on init
   * 
   * Fetches popular units and starts the subheader rotation
   */
  ngOnInit() {
    this.startSubheaderRotation();
  }

  ngAfterViewInit() {
    this.getPopularUnits();
  }

  /**
   * * Starts the subheader rotation animation
   */
  private startSubheaderRotation() {
    this.intervalId = setInterval(() => {
      // Start fade out
      this.subheaderState = 'out';

      // Update text and fade in after animation
      setTimeout(() => { 
        // Get a random index
        this.subheaderCurrentIndex = Math.floor(Math.random() * ((this.subheaders.length-1) - 0 + 1) + 0);
        // Increment the index
        // this.subheaderCurrentIndex = (this.subheaderCurrentIndex + 1) % this.subheader.length;
        
        // Start fade in
        this.subheaderState = 'in';
      }, this.subheaderChangeSecondsBuffer * 1000);
    }, this.subheaderChangeSeconds * 1000);
  }

  /**
   * * Fetches popular units from the API
   * 
   * Makes a GET request to the API to fetch popular units and stores them in the popularUnits array.
   */
  getPopularUnits() {
    this.loading = true;
    this.apiService.getPopularUnitsGET().subscribe({
      next: (response: Unit[]) => {
        // Map the response data to Unit objects
        this.popularUnits = response.map((unitData: any) => new Unit(unitData._id, unitData.unitCode, unitData.name, unitData.description, unitData.reviews, unitData.avgOverallRating, unitData.avgRelevancyRating, unitData.avgFacultyRating, unitData.avgContentRating, unitData.level, unitData.creditPoints, unitData.school, unitData.academicOrg, unitData.scaBand, unitData.requisites, unitData.offerings));

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

  /**
   * * Navigates to the unit list page
   * 
   * This is used for the explore units button on the home page.
   */
  exploreUnits() {
    this.router.navigate(['/unit-list']);
  }

  /**
   * * Runs on destroy
   * 
   * Clear the interval for the subheader rotation
   */
  ngOnDestroy(): void {
    if (this.intervalId)
      clearInterval(this.intervalId);
  }
}
