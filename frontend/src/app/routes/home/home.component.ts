import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, Meta, SafeHtml, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

// Constants
import {
  BASE_URL,
  META_AUTHOR,
  META_BASIC_TITLE,
  META_BASIC_TWITTER_TITLE,
  META_HOME_DESCRIPTION,
  META_HOME_KEYWORDS,
  META_HOME_OPEN_GRAPH_DESCRIPTION,
  META_HOME_TWITTER_DESCRIPTION,
  META_SITENAME,
} from '../../shared/constants/constants';

// Models
import { IUnit } from '../../shared/models/v2/unit.schema';

// Components
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ShinyMonstarTitleComponent } from '../../shared/components/shiny-monstar-title/shiny-monstar-title.component';
import { UnitCardComponent } from '../../shared/components/unit-card/unit-card.component';

// Modules
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';

// Services
import { GetUnitService } from '../../shared/services/api/get-unit.service';
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
    ShinyMonstarTitleComponent,
  ],
  animations: [
    // * Animation for subheader text fade in/out
    trigger('fadeInOut', [
      state('in', style({ opacity: 1 })),
      state('out', style({ opacity: 0 })),
      transition('in => out', animate('500ms ease-out')),
      transition('out => in', animate('500ms ease-in')),
    ]),
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  // Loading status of popular units fetching
  loading: boolean = true;

  // Stores the popular units to be displayed on the home page
  popularUnits: IUnit[] = [];

  // Reference to the navbar child
  @ViewChild(NavbarComponent) navbar!: NavbarComponent;

  // Subheader variables
  subheaders: string[] = [
    'Best reviews for Monash Uni',
    'Login with your Monash Google account',
    'Find the best units for you!',
    "Don't be afraid, just write a review! 💪",
    "Don't be afraid, just write a review! 💪",
    "Don't be afraid, just write a review! 💪",
    "Don't be afraid, just write a review! 💪",
    'What units should I take next semester?',
    'Rate and review your favourite units!',
    "What's a WAM booster?",
    'What unit should I do bro?',
    'Yes, we have all the units you need!',
    'Also check out our unit map!',
    'Made by students for students!',
    'Discover units with highest satisfaction',
    'Find units that align with your interests',
    'Your one-stop shop for unit reviews',
    "Learn from others' experiences",
    'Honest reviews from real students',
    'Plan your degree path with confidence',
    'Stay ahead with student recommendations',
    'Helping you choose better units since 2025',
    'Did someone say HD? 🎓',
    'Maximise your learning potential',
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
    'Find your next favorite unit here',
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
      numScroll: 1,
    },
    {
      breakpoint: '990px',
      numVisible: 1,
      numScroll: 1,
    },
  ];

  // Sponsors data
  sponsors = [
    {
      name: 'Jane Street',
      url: 'https://www.janestreet.com/',
      logoType: 'image' as const,
      imagePath: 'sponsors/jane-street.svg',
    },
    {
      name: 'Faculty of IT - Monash University',
      url: 'https://www.monash.edu/it',
      logoType: 'image' as const,
      imagePath: 'sponsors/monash.svg',
    },
    {
      name: 'WIRED Monash',
      url: 'https://wired.org.au/',
      logoType: 'image' as const,
      imagePath: 'sponsors/wired.svg',
    },
    {
      name: 'Honeywell',
      url: 'https://www.honeywell.com/',
      logoType: 'image' as const,
      imagePath: 'sponsors/honeywell.svg',
    },
    {
      name: 'Record Point',
      url: 'https://www.recordpoint.com/',
      logoType: 'image' as const,
      imagePath: 'sponsors/record-point.svg',
    },
  ];

  /**
   * ! Constructor
   */
  constructor(
    private router: Router,
    private getUnitService: GetUnitService,
    private sanitizer: DomSanitizer,
    private navigationService: NavigationService,
    private meta: Meta,
    private titleService: Title
  ) {}

  /**
   *  ! |======================================================================|
   *  ! | LIFECYCLE HOOKS
   *  ! |======================================================================|
   */

  ngOnInit() {
    // Set meta tags for SEO
    this.updateMetaTags();

    this.startSubheaderRotation();
    this.preloadEmotes();
  }

  ngAfterViewInit() {
    this.getPopularUnits();
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);

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
    this.titleService.setTitle(
      'MonSTAR | Browse and Review Monash University Units'
    );
  }

  /**
   *  ! |======================================================================|
   *  ! | API CALLS
   *  ! |======================================================================|
   */

  getPopularUnits() {
    this.loading = true;
    this.getUnitService.getPopularUnits().subscribe({
      next: (units) => {
        this.popularUnits = units;

        this.loading = false;
      },
    });
  }

  /**
   *  ! |======================================================================|
   *  ! | HELPERS
   *  ! |======================================================================|
   */

  private preloadEmotes(): void {
    const emoteList = [
      'emotes/emote-angry.webp',
      'emotes/emote-cool.webp',
      'emotes/emote-fine.webp',
      'emotes/emote-nerd.webp',
      'emotes/emote-study.webp',
    ];

    this.totalEmotes = emoteList.length;

    // Only populate emotes array after all images are loaded
    emoteList.forEach((emotePath) => {
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
      };
      img.src = emotePath;
    });
  }

  /**
   * Starts the subheader rotation animation
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
        ).filter((i) => i !== prevIndex);

        // Get a random index
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        this.subheaderCurrentIndex = availableIndices[randomIndex];

        // Fade in the new subheader
        this.subheaderState = 'in';
      }, this.subheaderChangeSecondsBuffer * 1000);
    }, this.subheaderChangeSeconds * 1000);
  }

  /**
   * Safely renders HTML content
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

  navigateTo(nav: string) {
    this.navigationService.navigateTo([nav]);
  }

  /**
   *  ! |======================================================================|
   *  ! | META TAGS
   *  ! |======================================================================|
   */

  private updateMetaTags(): void {
    const pageUrl = BASE_URL;

    // Set the document title
    this.titleService.setTitle(META_BASIC_TITLE);

    // Core meta tags
    this.meta.updateTag({
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });

    // Basic meta tags
    this.meta.updateTag({
      name: 'description',
      content: META_HOME_DESCRIPTION,
    });
    this.meta.updateTag({ name: 'keywords', content: META_HOME_KEYWORDS });
    this.meta.updateTag({ name: 'author', content: META_AUTHOR });

    // Open Graph tags for social sharing
    this.meta.updateTag({ property: 'og:site_name', content: META_SITENAME });
    this.meta.updateTag({ property: 'og:title', content: META_BASIC_TITLE });
    this.meta.updateTag({
      property: 'og:description',
      content: META_HOME_OPEN_GRAPH_DESCRIPTION,
    });
    this.meta.updateTag({ property: 'og:url', content: pageUrl });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:locale', content: 'en_AU' });

    // Twitter Card tags
    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    this.meta.updateTag({
      name: 'twitter:title',
      content: META_BASIC_TWITTER_TITLE,
    });
    this.meta.updateTag({
      name: 'twitter:description',
      content: META_HOME_TWITTER_DESCRIPTION,
    });
  }
}
