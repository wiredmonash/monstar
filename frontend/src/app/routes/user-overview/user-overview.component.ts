import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Constants
import { BASE_URL, NAVBAR_HEIGHT } from '../../shared/constants';

// Services
import { ApiService } from '../../shared/services/api.service';
import { MessageService } from 'primeng/api';
import { FooterService } from '../../shared/services/footer.service';

// Components
import { ReviewCardComponent } from "../../shared/components/review-card/review-card.component";

// Modules
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ToastModule } from 'primeng/toast';
import { AccordionModule } from 'primeng/accordion';

// Models
import { Review } from '../../shared/models/review.model';
import { User } from '../../shared/models/user.model';
import { Unit } from '../../shared/models/unit.model';

// Interface for grouped reviews
interface UnitReviewGroup {
  unit: Unit;
  unitCode: string;
  unitName: string;
  reviews: Review[];
  averageRating: number;
}

@Component({
  selector: 'app-user-overview',
  standalone: true,
  imports: [
    ReviewCardComponent,
    ToastModule,
    ProgressSpinnerModule,
    SkeletonModule,
    ScrollPanelModule,
    AccordionModule,
    CommonModule,
    FormsModule,
  ],
  providers: [
    MessageService,
  ],
  templateUrl: './user-overview.component.html',
  styleUrl: './user-overview.component.scss'
})
export class UserOverviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('userOverviewContainer') userOverviewContainer!: ElementRef;

  user: User | null = null;
  reviews: Review[] = [];
  groupedReviews: UnitReviewGroup[] = [];
  reviewsLoading: boolean = true;
  userLoading: boolean = true;
  
  private destroy$ = new Subject<void>();
  private resizeHandlerBound = this.resizeHandler.bind(this);

  /**
   * Constructor
   */
  constructor (
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private meta: Meta,
    private titleService: Title,
    private footerService: FooterService
  ) { }

  /** 
   * Runs on initialisation
   */ 
  ngOnInit(): void {
    // Hide the footer
    this.footerService.hideFooter();

    // Get username from the route parameters
    const username = this.route.snapshot.paramMap.get('username');

    if (!username || username.trim() === '') {
      console.error('No username provided in route parameters');
      this.router.navigate(['/404']);
      return;
    }

    this.loadUserData(username);
  }

  /**
   * Runs after the view has been initialised
   */
  ngAfterViewInit(): void {
    // Add resize listener with bound context
    window.addEventListener('resize', this.resizeHandlerBound);
    
    // Use setTimeout to ensure ViewChild is initialized
    setTimeout(() => {
      this.updateContainerHeight();
    }, 0);
  }

  /**
   * On Component Destruction
   */
  ngOnDestroy(): void {
    // Complete the subject to unsubscribe from all observables
    this.destroy$.next();
    this.destroy$.complete();

    // Remove the event listener with the same reference
    window.removeEventListener('resize', this.resizeHandlerBound);

    // Reset height of the user overview container
    if (this.userOverviewContainer?.nativeElement) {
      this.userOverviewContainer.nativeElement.style.height = '';
    }

    // Show the footer again
    this.footerService.showFooter();

    // Reset title
    this.titleService.setTitle('Unit Reviews');
    
    // Proper meta tag cleanup
    this.cleanupMetaTags();
  }

  /**
   * Load user data and reviews simultaneously
   */
  private loadUserData(username: string): void {
    this.userLoading = true;
    this.reviewsLoading = true;

    console.log(`Attempting to load data for username: ${username}`);

    // First get the user data
    this.apiService.getUserByUsernameGET(username).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (userData) => {
        console.log('loadUserData: Received user data:', userData);
        this.userLoading = false;

        if (!userData) {
          console.log('loadUserData: No user data received, user probably does not exist');
          this.reviewsLoading = false;
          this.handleUserNotFound();
          return;
        }

        this.user = userData;
        console.log('loadUserData: User found:', userData);

        // Now get reviews using the user ID
        this.apiService.getUserReviewsGET(userData._id.toString()).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (reviewsData) => {
            console.log('loadUserData: Received reviews data:', reviewsData);
            this.reviews = reviewsData || [];
            this.groupReviewsByUnit();
            this.reviewsLoading = false;
            
            this.updateMetaTags();
            this.updateContainerHeight();
            
            console.log('Successfully loaded all user data');
          },
          error: (error) => {
            console.error('Error fetching user reviews:', error);
            this.reviews = [];
            this.groupedReviews = [];
            this.reviewsLoading = false;
            // Don't redirect on reviews error, just show empty reviews
          }
        });
      },
      error: (error) => {
        console.error('Error fetching user:', error);
        console.error('User API endpoint failed:', error.url);
        this.userLoading = false;
        this.reviewsLoading = false;
        this.handleUserNotFound();
      }
    });
  }

  /**
   * Group reviews by unit
   */
  private groupReviewsByUnit(): void {
    const groupMap = new Map<string, UnitReviewGroup>();

    this.reviews.forEach(review => {
      let unitCode = 'Unknown Unit';
      let unitName = 'Unit information not available';
      let unit: Unit | null = null;

      // Check if unit is populated
      if (review.unit && typeof review.unit === 'object' && 'unitCode' in review.unit) {
        unit = review.unit as Unit;
        unitCode = unit.unitCode || 'Unknown Unit';
        unitName = unit.name || 'Unit information not available';
      }

      if (!groupMap.has(unitCode)) {
        groupMap.set(unitCode, {
          unit: unit!,
          unitCode,
          unitName,
          reviews: [],
          averageRating: 0
        });
      }

      groupMap.get(unitCode)!.reviews.push(review);
    });

    // Calculate average ratings and convert to array
    this.groupedReviews = Array.from(groupMap.values()).map(group => {
      const totalRating = group.reviews.reduce((sum, review) => sum + review.overallRating, 0);
      group.averageRating = group.reviews.length > 0 ? totalRating / group.reviews.length : 0;
      return group;
    });

    // Sort by unit code
    this.groupedReviews.sort((a, b) => a.unitCode.localeCompare(b.unitCode));

    console.log('Grouped reviews:', this.groupedReviews);
  }

  /**
   * Handle user not found scenario
   */
  private handleUserNotFound(): void {
    console.log('handleUserNotFound: User not found, showing error message');
    
    this.messageService.add({
      severity: 'error',
      summary: 'User Not Found',
      detail: 'The requested user could not be found.'
    });
    
    // Redirect to 404 after showing error
    console.log('handleUserNotFound: Redirecting to /404 in 2 seconds');
    setTimeout(() => {
      console.log('handleUserNotFound: Executing redirect to /404');
      this.router.navigate(['/404']).then(
        (success) => console.log('Navigation to /404 successful:', success),
        (error) => console.error('Navigation to /404 failed:', error)
      );
    }, 2000);
  }

  /**
   * Refreshes reviews after deletion
   */
  refreshReviews(action?: string): void {
    const username = this.route.snapshot.paramMap.get('username');
    if (!username || !this.user) return;

    this.reviewsLoading = true;
    
    // Use the user ID we already have to get reviews
    this.apiService.getUserReviewsGET(this.user._id.toString()).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (reviews: Review[]) => {
        this.reviews = reviews;
        this.groupReviewsByUnit();
        this.reviewsLoading = false;
        this.updateContainerHeight();
        
        if (action === 'delete') {
          this.messageService.add({
            severity: 'success',
            summary: 'Review Deleted',
            detail: 'The review has been successfully deleted.'
          });
        }
      },
      error: (error: any) => {
        console.error('Error refreshing user reviews:', error);
        this.reviewsLoading = false;
        this.reviews = [];
        this.groupedReviews = [];
      }
    });
  }

  /**
   * Gets user initials for avatar
   */
  getInitials(name: string): string {
    if (!name || typeof name !== 'string') return 'U';
    
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return 'U';
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Track by function for ngFor - unit groups
   */
  trackByUnitCode(index: number, group: UnitReviewGroup): string {
    return group.unitCode;
  }

  /**
   * Track by function for ngFor - reviews
   */
  trackByReviewId(index: number, review: Review): string {
    return review._id.toString();
  }

  /**
   * Get star rating display for unit group
   */
  getStarRating(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
  }

  /**
   * Updates container height based on content
   */
  private updateContainerHeight(): void {
    if (!this.userOverviewContainer?.nativeElement) return;

    const container = this.userOverviewContainer.nativeElement;
    
    // Default height
    container.style.height = `calc(100vh - ${NAVBAR_HEIGHT})`;
    
    // Adjust based on content if needed
    if (this.groupedReviews.length > 2) {
      container.style.height = 'auto';
      container.style.minHeight = `calc(100vh - ${NAVBAR_HEIGHT})`;
    }
  }

  /**
   * Resize handler (properly bound)
   */
  private resizeHandler(): void {
    this.updateContainerHeight();
  }

  /**
   * Updates Meta Tags
   */
  private updateMetaTags(): void {
    if (!this.user?.username) {
      console.warn('Cannot update meta tags: User data is not available');
      return;
    }

    const username = this.user.username;
    const pageUrl = `${BASE_URL}/user/${username}`;
    
    // Basic meta tags
    this.titleService.setTitle(`${username}'s Reviews | Unit Reviews`);
    
    this.meta.updateTag({ 
      name: 'description', 
      content: `View all reviews written by ${username}. See their thoughts and ratings on university units.` 
    });

    this.meta.updateTag({
      name: 'keywords',
      content: `${username}, reviews, university, units, ratings`
    });

    // Open Graph tags for social sharing
    this.meta.updateTag({ property: 'og:title', content: `${username}'s Reviews` });
    this.meta.updateTag({ 
      property: 'og:description', 
      content: `View all reviews written by ${username} on Unit Reviews.` 
    });
    this.meta.updateTag({ property: 'og:url', content: pageUrl });
    this.meta.updateTag({ property: 'og:type', content: 'profile' });
    
    // Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: `${username}'s Reviews` });
    this.meta.updateTag({ 
      name: 'twitter:description', 
      content: `View all reviews written by ${username}.` 
    });
  }

  /**
   * Clean up meta tags properly
   */
  private cleanupMetaTags(): void {
    // Remove meta tags with proper selectors
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
}