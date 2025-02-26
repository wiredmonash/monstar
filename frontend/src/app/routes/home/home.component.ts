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
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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

  // Subheader variables
  subheaders: string[] = [
    'Best reviews for Monash Uni',
    'Login with your Monash Google',
    'Find the best units for you!', 
    "Don't be afraid, just do it! 💪",
    'What units should I take next semester?',
    'Rate and review your favourite units!',
    'Sigma unit reviews 😎',
    "What's a WAM booster?",
    'What unit should I do bro?',
    'Yes, we have all the units you need!',
    'I forgor 🤪',
    'Also check out our unit map!',
    'Cheeky insta plug <a href="https://www.instagram.com/jenul_ferdinand/" target="_blank" style="color: var(--primary-color);">@jenul_ferdinand</a>',
  ];
  subheaderCurrentIndex: number = 0;
  subheaderPreviousIndex: number = 0;
  subheaderState: 'in' | 'out' = 'in';
  subheaderChangeSeconds: number = 4;
  subheaderChangeSecondsBuffer: number = 0.5;
  private intervalId: any; // The ID of the interval used for deletion

  // Emotes
  emotes: string[] = [];
  emoteLoadingComplete: boolean = false;
  loadedEmotes: number = 0;
  totalEmotes: number = 0;

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
    private sanitizer: DomSanitizer
  ) { }


  /**
   * * Runs on init
   * 
   * Fetches popular units and starts the subheader rotation
   */
  ngOnInit() {
    this.startSubheaderRotation();
    this.preloadEmotes();
  }

  ngAfterViewInit() {
    this.getPopularUnits();
  }

  /**
   * * Preload all emote images before displaying
   */
  private preloadEmotes(): void {
    const emoteList = [
      'emotes/emote-angry.webp',
      "emotes/emote-cool.webp",
      "emotes/emote-default.webp",
      "emotes/emote-fine.webp",
      "emotes/emote-nerd.webp",
      "emotes/emote-study.webp",
    ];

    this.totalEmotes = emoteList.length;

    // Only populate emotes array after all images are loaded
    emoteList.forEach(emotePath => {
      const img = new Image();
      img.onload = () => {
        this.loadedEmotes++;
        if (this.loadedEmotes === this.totalEmotes) {
          this.emotes = emoteList;
          this.emoteLoadingComplete = true;
        }
      };
      img.onerror = () => {
        // Still count errors to avoid hanging if images fail to load
        this.loadedEmotes++;
      }
      img.src = emotePath;
    });
  }

  /**
   * * Starts the subheader rotation animation
   */
  private startSubheaderRotation() {
    this.intervalId = setInterval(() => {
      this.subheaderState = 'out';

      // Update text and fade in after animation
      setTimeout(() => { 
        // Store previous index
        const prevIndex = this.subheaderCurrentIndex;

        // Generate array of all possible indices except current
        const availableIndices = Array.from(
          { length: this.subheaders.length },
          (_, i) => i
        ).filter(i => i !== prevIndex);

        // Get a random index
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        this.subheaderCurrentIndex = availableIndices[randomIndex];

        // Fade in the new subheader
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

  /**
   * * Safely renders HTML content
   * 
   * @param html The HTML string to sanitize
   * @returns SafeHtml that can be rendered with innerHTML
   */
  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
