import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { filter, take } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

// Constants
import { BASE_URL, getMetaUnitOverviewDescription, getMetaUnitOverviewKeywords, getMetaUnitOverviewOpenGraphDescription, getMetaUnitOverviewOpenGraphTitle, getMetaUnitOverviewTitle, getMetaUnitOverviewTwitterDescription, getMetaUnitOverviewTwitterTitle, NAVBAR_HEIGHT } from '../../shared/constants';

// Services
import { ApiService } from '../../shared/services/api.service';
import { MessageService } from 'primeng/api';
import { FooterService } from '../../shared/services/footer.service';

// Components
import { ReviewCardComponent } from "../../shared/components/review-card/review-card.component";
import { UnitReviewHeaderComponent } from "../../shared/components/unit-review-header/unit-review-header.component";
import { SetuCardComponent } from '../../shared/components/setu-card/setu-card.component';
// Modules
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ToastModule } from 'primeng/toast';
import { Review } from '../../shared/models/review.model';

@Component({
  selector: 'app-unit-overview',
  standalone: true,
  imports: [
    ReviewCardComponent, 
    UnitReviewHeaderComponent,
    SetuCardComponent,
    ToastModule,
    ProgressSpinnerModule,
    SkeletonModule,
    ScrollPanelModule,
    CommonModule,
    FormsModule,
  ],
  providers: [
    MessageService,
  ],
  templateUrl: './unit-overview.component.html',
  styleUrl: './unit-overview.component.scss'
})
export class UnitOverviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('headerSkeleton') headerSkeleton!: ElementRef;
  @ViewChild('unitOverviewContainer') unitOverviewContainer!: ElementRef;

  unit: any = null;
  reviews: Review[] = [];
  reviewsLoading: boolean = true;

  // Split view boolean
  isSplitView: boolean = false;
  splitViewMinWidth: number = 1414;

  // Resize handler 
  private resizeHandler = () => {
    this.isSplitView = window.innerWidth >= this.splitViewMinWidth;
    this.updateContainerHeight();
  }

  /**
   * === Constructor ===
   * 
   * @param {ApiService} apiService - The API service to make API calls.
   * @param {ActivatedRoute} route - The route service to get the route parameters.
   * @param {MessageService} messageService - The message service to show toasts.
   */
  constructor (
    private apiService: ApiService,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private meta: Meta,
    private router: Router,
    private titleService: Title,
    private footerService: FooterService
  ) { }


  /** 
   * * Runs on initialisation
   * 
   * Gets the unitcode from the URL param and uses it to get the unit and reviews.
   */ 
  ngOnInit(): void {
    // Hide the footer
    this.footerService.hideFooter();

    this.isSplitView = window.innerWidth >= this.splitViewMinWidth;

    // Get unit code from the route parameters
    const unitCode = this.route.snapshot.paramMap.get('unitcode');

    if (unitCode) {
      this.getUnitByUnitcode(unitCode) // Get the unit
      this.getAllReviews(unitCode); // Get the reviews
    }
  }

  /**
   * * Runs after the view has been initialised
   */
  ngAfterViewInit(): void {
    window.addEventListener('resize', this.resizeHandler);
  }

  /**
   * * On Component Destruction
   */
  ngOnDestroy(): void {
    // Remove the event listener
    window.removeEventListener('resize', this.resizeHandler);

    // Reset height of the unit overview container
    this.unitOverviewContainer.nativeElement.style.height = ''

    // Show the footer again
    this.footerService.showFooter();

    // Reset title
    this.titleService.setTitle('MonSTAR | Browse and Review Monash University Units');
    
    // Remove all custom meta tags
    this.meta.removeTag("name='description'");
    this.meta.removeTag("name='keywords'");
    this.meta.removeTag("property='og:title'");
    this.meta.removeTag("property='og:description'");
    this.meta.removeTag("property='og:url'");
    this.meta.removeTag("property='og:type'");
    this.meta.removeTag("name='twitter:card'");
    this.meta.removeTag("name='twitter:title'");
    this.meta.removeTag("name='twitter:description'");
  }


  /**
   * * Fetches all reviews from the API and stores them in the component.
   *
   * This method calls the API to retrieve all the reviews and stores the fetched reviews in the `reviews` property.
   * It also logs the response to the console for debugging purposes.
   */
  getAllReviews(unitCode?: any) {
    this.apiService.getAllReviewsGET(unitCode).subscribe(
      (reviews: Review[]) => {
        // Store the fetched reviews
        this.reviews = reviews;

        this.sortReviews('most-likes'); // Sort by most-likes by default

        // Update the reviews property in the unit object
        if (this.unit) this.unit.reviews = this.reviews;

        // Not loading anymore
        this.reviewsLoading = false;

        this.resetScrollPosition();

        // ? Debug log: Success
        // console.log('GET Get All Reviews', reviews);
      },
      (error: any) => {
        // ? Debug log: Error
        // console.log('ERROR DURING: GET Get All Reviews', error)
      },
      (() => {
        // Update the height of the whole container
        this.updateContainerHeight();
      })
    );
  }

  /**
   * * Fetches the unit by its unit code and stores it in the component.
   *
   * This method calls the API to retrieve the unit details for a specific unit code ('fit1045'),
   * and stores the resulting unit data in the `unit` property.
   * 
   * Logs the success or error response to the console.
   */
  getUnitByUnitcode(unit: string) {
    this.apiService.getUnitByUnitcodeGET(unit).subscribe(
      (unit: any) => {
        // Store the unit
        this.unit = unit;

        // Update meta tags AFTER unit data is available
        this.updateMetaTags();

        this.resetScrollPosition()

        // ? Debug log: Success
        // console.log('GET Get Unit by Unitcode', unit);
      },
      (error: any) => {
        // ? Debug log: Error
        // console.log('ERROR DURING: GET Get Unit by Unitcode');
      }
    );
  }


  /**
   * * Sorts the reviews array based on the specified criteria
   * 
   * @param {string} criteria - The criteria to sort the reviews by.
   * 
   * Criteria options
   * - 'recent': Sorts the reviews by most recent first based on `createdAt` property.
   * - 'lowest-rating': Sorts the reviews by the lowest rating (`overallRating`) first.
   * - 'highest-rating': Sorts the reviews by the highest rating (`overallRating`) first.
   * - 'most-likes': Sorts the reviews by the most likes first.
   */
  sortReviews(criteria: string) {
    // ? Debug log: Sorting reviews message
    // console.log('Sorting reviews', criteria); 
    
    // Criterion
    switch (criteria) {

      // Sorting by oldest
      case 'oldest':
        this.reviews.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;

      // Sorting by most recent
      case 'recent':
        this.reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;

      // Sorting by lowest rating
      case 'lowest-rating':
        this.reviews.sort((a, b) => a.overallRating - b.overallRating);
        break;

      // Sorting by highest rating
      case 'highest-rating':
        this.reviews.sort((a, b) => b.overallRating - a.overallRating);
        break;
      
      // Sorting by most likes
      case 'most-likes':
        this.reviews.sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
        break;
      
      // Sorting by most dislikes
      case 'most-dislikes':
        this.reviews.sort((a, b) => (a.likes - a.dislikes) - (b.likes - b.dislikes));
        break;
    }
  }

  /**
   * This method is called finally after a few event emittors going from:
   * write-review-unit (emits reviewPosted) -> unit-review-header (emits reviewAdded) -> unit-overview
   */
  refreshReviews(toast?: string) {
    if (this.unit && this.unit.unitCode) {
      this.reviewsLoading = true;                 // Set the loading state to true again.
      this.getAllReviews(this.unit.unitCode);     // Get all the reviews again. 
      this.getUnitByUnitcode(this.unit.unitCode); // Get the unit again for updated avg ratings.

      if (toast == 'delete') {
        // Show delete toast
        this.messageService.add({ severity: 'warn', summary: 'Review deleted!', detail: `Review has been deleted.` });
      } else if (toast == 'edit') {
        // Show edit toast
        this.messageService.add({ severity: 'success', summary: 'Review edited!', detail: `Review has been updated.` });
      }
    }
  }

  /** 
   *  ! |======================================================================|
   *  ! | UI Manipulators
   *  ! |======================================================================|
   */

  /**
   * * Updates unit overview container height
   * 
   * Runs on window resize and component initialisation
   * 
   * - If we're in split view we use 100vh
   * - If we have 1 review then we use 100vh minus the height of the navbar and 
   * prevent scrolling.
   * - If we have more than 2 reviews, then we use 100% to grow to full height.
   */
  updateContainerHeight() {
    // Start of with 100vh to work with split view
    this.unitOverviewContainer.nativeElement.style.height = '100vh';

    // No change if we're in split view
    if (this.isSplitView) {
      this.unitOverviewContainer.nativeElement.style.height = '';
    } else {
      this.unitOverviewContainer.nativeElement.style.height = '100%';
      this.unitOverviewContainer.nativeElement.style.overflow = '';
    }
  }

  /**
   * * Reset scroll position on all possible containers
   */
  private resetScrollPosition(): void {
    console.log('Resetting scroll position');

    // Reset main window scroll
    window.scrollTo(0,0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    // Reset any scroll panels
    const scrollContainers = document.querySelectorAll('.p-scrollpanel-content, .p-scrollpanel-wrapper');
    scrollContainers.forEach(container => {
      if (container instanceof HTMLElement) {
        container.scrollTop = 0;
      }
    });

    // Try to get the app's main content container
    const appContent = document.querySelector('app-root');
    if (appContent) {
      appContent.scrollTop = 0;
    }
  }



  /** 
   *  ! |======================================================================|
   *  ! | META TAGS                                                            
   *  ! |======================================================================|
   */

  /**
   * * Updates Meta Tags
   */
  updateMetaTags(): void {
    if (!this.unit || !this.unit.unitCode) {
      console.warn('Cannot update meta tags: Unit data is not available');
      return;
    }

    const unitReviewsCount = this.unit.reviews.length;
    const unitAverageRating = this.unit.avgOverallRating.toFixed(1);
    const unitCode = this.unit.unitCode.toUpperCase();
    const unitName = this.unit.name;
    const pageUrl = `${BASE_URL}/unit/${this.unit.unitCode}`;
    
    // Basic meta tags
    this.titleService.setTitle(getMetaUnitOverviewTitle(unitCode, unitName));
    this.meta.updateTag({ name: 'description', content: getMetaUnitOverviewDescription(unitReviewsCount, unitCode, unitName) });
    this.meta.updateTag({ name: 'keywords', content: getMetaUnitOverviewKeywords(unitCode, unitName) });

    // Open Graph tags for social sharing
    this.meta.updateTag({ property: 'og:title', content: getMetaUnitOverviewOpenGraphTitle(unitCode, unitName) });
    this.meta.updateTag({ property: 'og:description', content: getMetaUnitOverviewOpenGraphDescription(unitCode, unitAverageRating, unitReviewsCount) });
    this.meta.updateTag({ property: 'og:url', content: pageUrl });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    
    // Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: getMetaUnitOverviewTwitterTitle(unitCode) });
    this.meta.updateTag({ name: 'twitter:description', content: getMetaUnitOverviewTwitterDescription(unitCode, unitName, unitAverageRating) });
  }
}
