import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { ReviewCardComponent } from "../../shared/components/review-card/review-card.component";
import { UnitReviewHeaderComponent } from "../../shared/components/unit-review-header/unit-review-header.component";
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-unit-overview',
  standalone: true,
  imports: [
    ReviewCardComponent, 
    UnitReviewHeaderComponent,
    ToastModule,
    ProgressSpinnerModule,
    SkeletonModule,
    CommonModule,
    FormsModule
  ],
  providers: [
    MessageService,
  ],
  templateUrl: './unit-overview.component.html',
  styleUrl: './unit-overview.component.scss'
})
export class UnitOverviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('headerSkeleton') headerSkeleton!: ElementRef;

  unit: any = null;
  reviews: any[] = [];
  reviewsLoading: boolean = true;

  // Header skeleton heights for different screen sizes
  private readonly SKELETON_HEIGHTS = {
    mobile: '606px',
    tablet: '431.6px',
    laptop: '273.2px',
    desktop: '255.2px'
  }
  skeletonHeight: string = this.SKELETON_HEIGHTS.desktop;


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
    private titleService: Title
  ) { }


  /** 
   * * Runs on initialisation
   * 
   * Gets the unitcode from the URL param and uses it to get the unit and reviews.
   */ 
  ngOnInit(): void {
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
    this.updateSkeletonHeight();
    window.addEventListener('resize', () => this.updateSkeletonHeight());
  }

  /**
   * * On Component Destruction
   * 
   * - Removes the event listener for window resize
   */
  ngOnDestroy(): void {
    window.removeEventListener('resize', () => this.updateSkeletonHeight());

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
      (reviews: any) => {
        // Store the fetched reviews
        this.reviews = reviews;

        this.sortReviews('most-likes'); // Sort by most-likes by default

        // Update the reviews property in the unit object
        if (this.unit) this.unit.reviews = this.reviews;

        // Not loading anymore
        this.reviewsLoading = false;

        // ? Debug log: Success
        console.log('GET Get All Reviews', reviews);
      },
      (error: any) => {
        // ? Debug log: Error
        console.log('ERROR DURING: GET Get All Reviews', error)
      }
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

        // ? Debug log: Success
        console.log('GET Get Unit by Unitcode', unit);
      },
      (error: any) => {
        // ? Debug log: Error
        console.log('ERROR DURING: GET Get Unit by Unitcode');
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
    console.log('Sorting reviews', criteria); 
    
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
        // Show toast
        this.messageService.add({ severity: 'warn', summary: 'Review deleted!', detail: `Review has been deleted.` });
      }
    }
  }

  /**
   * * Updates the height of the header skeleton based on the screen size
   */
  private updateSkeletonHeight() {
    const width = window.innerWidth;
    let height = this.SKELETON_HEIGHTS.desktop;

    if (width < 768) {
      height = this.SKELETON_HEIGHTS.mobile;
    } else if (width < 976) {
      height = this.SKELETON_HEIGHTS.tablet;
    } else if (width < 1110) {
      height = this.SKELETON_HEIGHTS.laptop;
    }

    this.skeletonHeight = height;
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

    const unitCode = this.unit.unitCode.toUpperCase();
    const unitName = this.unit.name;
    const baseUrl = 'https://monstar.wired.org.au'; // Replace with your actual domain
    const pageUrl = `${baseUrl}/unit/${this.unit.unitCode}`;
    
    // Basic meta tags
    this.titleService.setTitle(`${unitCode} (${unitName}) Student Reviews at Monash University`);
    
    this.meta.updateTag({ 
      name: 'description', 
      content: `Read ${this.unit.reviews.length} student reviews for ${unitCode} (${unitName}) at Monash University. See ratings, difficulty level, and student experiences.` 
    });
    
    this.meta.updateTag({ 
      name: 'keywords', 
      content: `${unitCode}, ${unitName}, Monash, Monash Uni, Monash University, unit reviews, student reviews, course reviews, MonSTAR, ${unitCode} reviews, ${unitCode} difficulty, ${unitCode} ratings`
    });

    // Open Graph tags for social sharing
    this.meta.updateTag({ property: 'og:title', content: `${unitCode} - ${unitName} | Student Reviews` });
    this.meta.updateTag({ 
      property: 'og:description', 
      content: `See what students think about ${unitCode}. Average rating: ${this.unit.avgOverallRating.toFixed(1)}/5 from ${this.unit.reviews.length} reviews.` 
    });
    this.meta.updateTag({ property: 'og:url', content: pageUrl });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    
    // Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: `${unitCode} Student Reviews at Monash University` });
    this.meta.updateTag({ 
      name: 'twitter:description', 
      content: `See what Monash students think about ${unitCode} (${unitName}). Average rating: ${this.unit.avgOverallRating.toFixed(1)}/5.` 
    });
  }
}
