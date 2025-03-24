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
import { DomSanitizer, Meta, SafeHtml, Title } from '@angular/platform-browser';
import { NavigationService } from '../../shared/services/navigation.service';

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
    'Made by students for students!',
    'Discover units with highest satisfaction',
    'Find units that align with your interests',
    'Your one-stop shop for unit reviews',
    'Learn from others\' experiences',
    'Honest reviews from real students',
    'Plan your degree path with confidence',
    'Stay ahead with student recommendations',
    'Helping you choose better units since 2023',
    'Get the inside scoop on assessments',
    'Did someone say HD? 🎓',
    'Maximize your learning potential',
    'Units rated by students like you',
    'Easy units? Hard units? We got you covered!',
    'Find the units everyone is raving about',
    'By WIRED, for Monash students everywhere',
    'Procrastinating unit selection? We can help!',
    'Unlock the secrets of unit selection',
    'Pro tip: check reviews before enrolling',
    'Make informed choices for your degree',
    'Time to level up your unit game!',
    'The units students actually recommend',
    'Find your next favorite unit here'
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
   * ! Constructor
   */
  constructor (
    private router: Router,
    private apiService: ApiService,
    private sanitizer: DomSanitizer,
    private navigationService: NavigationService,
    private meta: Meta,
    private titleService: Title
  ) { }


  /** 
   *  ! |======================================================================|
   *  ! | LIFECYCLE HOOKS                                                            
   *  ! |======================================================================|
   */

  /**
   * * Runs on init
   * 
   * Fetches popular units and starts the subheader rotation
   */
  ngOnInit() {
    // Set meta tags for SEO
    this.updateMetaTags();

    this.startSubheaderRotation();
    this.preloadEmotes();
  }

  /**
   * * Runs after view has initialised
   * 
   * Gets the popular units
   */
  ngAfterViewInit() {
    this.getPopularUnits();
  }

  /**
   * * Runs on destroy
   * 
   * Clear the interval for the subheader rotation
   */
  ngOnDestroy(): void {
    if (this.intervalId)
      clearInterval(this.intervalId);

    // Remove meta tags when navigating away from home
    this.meta.removeTag("name='description'");
    this.meta.removeTag("name='keywords'");
    this.meta.removeTag("name='author'");
    this.meta.removeTag("property='og:site_name'");
    this.meta.removeTag("property='og:title'");
    this.meta.removeTag("property='og:description'");
    this.meta.removeTag("property='og:url'");
    this.meta.removeTag("property='og:type'");
    this.meta.removeTag("property='og:locale'");
    this.meta.removeTag("name='twitter:card'");
    this.meta.removeTag("name='twitter:title'");
    this.meta.removeTag("name='twitter:description'");
    
    // Reset title to default
    this.titleService.setTitle('MonSTAR | Browse and Review Monash University Units');
  }


  /** 
   *  ! |======================================================================|
   *  ! | API CALLS     
   *  ! |======================================================================|
   */

  /**
   * * Fetches popular units from the API
   * 
   * Makes a GET request to the API to fetch popular units and stores them in the popularUnits array.
   */
  getPopularUnits() {
    this.loading = true;
    this.apiService.getPopularUnitsGET().subscribe({
      next: (unitData) => {
        // Map the response data to Unit objects
        this.popularUnits = unitData.map(data => new Unit(data));

        this.loading = false;

        // ? Debug log success
        // console.log('Home | Popular units:', this.popularUnits);
      },
      error: (error) => {
        // ? Debug log error
        // console.log('Home | Error getting popular units:', error.error);
      }
    })
  }


  /** 
   *  ! |======================================================================|
   *  ! | HELPERS                                                            
   *  ! |======================================================================|
   */

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
   * * Safely renders HTML content
   * 
   * @param html The HTML string to sanitize
   * @returns SafeHtml that can be rendered with innerHTML
   */
  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  /** 
   *  ! |======================================================================|
   *  ! | NAVIGATION HELPERS                                                            
   *  ! |======================================================================|
   */

  /**
   * * Navigates to the unit list page
   * 
   * This is used for the explore units button on the home page.
   */
  exploreUnits() {
    this.router.navigate(['/list']);
  }

  /**
   * * Navigates to the about page
   */
  navigateTo(nav: string) {
    this.navigationService.navigateTo([nav]);
  }


  /** 
   *  ! |======================================================================|
   *  ! | META TAGS                                                            
   *  ! |======================================================================|
   */

  /**
   * * Updates meta tags for SEO
   */
  private updateMetaTags(): void {
    const baseUrl = 'https://monstar.wired.org.au';
    const pageUrl = `${baseUrl}`;
    
    // Set the document title
    this.titleService.setTitle('MonSTAR | Student Reviews for Monash University Units');
    
    // Core meta tags
    this.meta.updateTag({ name: 'viewport', content: 'width=device-width, initial-scale=1' });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    
    // Basic meta tags
    this.meta.updateTag({ 
      name: 'description', 
      content: 'MonSTAR is a platform for Monash University students to browse, review, and share feedback on academic units. Find the best units for your degree.'
    });
    
    this.meta.updateTag({ 
      name: 'keywords', 
      content: 'Monash University, Monash, student reviews, WAM booster, Monash reviews, Monash units, MonSTAR, WIRED Monash, best Monash units'
    });
    
    this.meta.updateTag({ name: 'author', content: 'WIRED Monash' });

    // Open Graph tags for social sharing
    this.meta.updateTag({ property: 'og:site_name', content: 'MonSTAR' });
    this.meta.updateTag({ property: 'og:title', content: 'MonSTAR | Student Reviews for Monash University Units' });
    this.meta.updateTag({ 
      property: 'og:description', 
      content: 'Find honest reviews of Monash University units from fellow students. Discover the best units for your degree path.'
    });
    this.meta.updateTag({ property: 'og:url', content: pageUrl });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:locale', content: 'en_AU' });
    
    // Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: 'MonSTAR - Monash Student Unit Reviews' });
    this.meta.updateTag({ 
      name: 'twitter:description', 
      content: 'Find the best Monash University units based on student reviews and ratings.'
    });
  }
}
