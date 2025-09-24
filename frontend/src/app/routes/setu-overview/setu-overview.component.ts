import { Component, OnDestroy, OnInit } from '@angular/core';
import { Setu } from '../../shared/models/setu.model';
import { ViewportService, ViewportType } from '../../shared/services/viewport.service';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { SetuService } from '../../shared/services/setu.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CarouselModule } from 'primeng/carousel';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { KnobModule } from 'primeng/knob';
import { BASE_URL, getMetaSetuOverviewDescription, getMetaSetuOverviewKeywords, getMetaSetuOverviewOpenGraphDescription, getMetaSetuOverviewOpenGraphTitle, getMetaSetuOverviewTitle, getMetaSetuOverviewTwitterDescription, getMetaSetuOverviewTwitterTitle } from '../../shared/constants';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-setu-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ProgressSpinnerModule,
    SkeletonModule,
    TooltipModule,
    ButtonModule,
    BadgeModule,
    DividerModule,
    KnobModule,
    CarouselModule,
  ],
  templateUrl: './setu-overview.component.html',
  styleUrl: './setu-overview.component.scss',
})
export class SetuOverviewComponent implements OnInit, OnDestroy {
  unitCode: string = '';
  setuData: Setu[] = [];
  selectedSetu: Setu | null = null; // Track which SETU data is currently selected for detailed view
  loading = true;
  error: string | null = null;
  viewportType: ViewportType = 'desktop';

  // Carousel responsive options
  responsiveOptions = [
    {
      breakpoint: '1024px',
      numVisible: 3,
      numScroll: 1,
    },
    {
      breakpoint: '768px',
      numVisible: 2,
      numScroll: 1,
    },
    {
      breakpoint: '560px',
      numVisible: 1,
      numScroll: 1,
    },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private setuService: SetuService,
    private viewportService: ViewportService,
    private meta: Meta,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    // Subscribe to viewport changes
    this.viewportService.viewport$
      .pipe(takeUntil(this.destroy$))
      .subscribe((type) => {
        this.viewportType = type;
      });

    // Get unit code from route params
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.unitCode = params['unitCode'];
      this.loadSetuData();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up meta tags
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
   * * Load SETU data for the unit
   */
  loadSetuData(): void {
    this.loading = true;
    this.error = null;

    this.setuService
      .getSetuByUnitCode(this.unitCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.setuData = data;
          // Set the most recent SETU as the initially selected one
          this.selectedSetu = this.getMostRecentSetu();
          this.loading = false;

          // Update meta tags
          this.updateMetaTags();
        },
        error: (error) => {
          this.error = 'Failed to load SETU data. Please try again later.';
          this.loading = false;
          console.error('Error loading SETU data:', error);
        },
      });
  }

  /**
   * Navigate back to unit overview
   */
  navigateBack(): void {
    this.router.navigate(['/unit', this.unitCode]);
  }

  /**
   * Get the most recent SETU data
   */
  getMostRecentSetu(): Setu | null {
    if (this.setuData.length === 0) return null;
    return this.setuData[0]; // Data is sorted by season descending
  }

  /**
   * Get the currently selected SETU data for detailed view
   */
  getSelectedSetu(): Setu | null {
    return this.selectedSetu || this.getMostRecentSetu();
  }

  /**
   * Select a specific SETU data for detailed view
   */
  selectSetuData(setu: Setu): void {
    this.selectedSetu = setu;
  }

  /**
   * Check if a SETU data is currently selected
   */
  isSetuSelected(setu: Setu): boolean {
    const selected = this.getSelectedSetu();
    return selected ? selected._id === setu._id : false;
  }

  /**
   * Get circle class for rating display
   */
  getCircleClass(rating: number, circle: number): string {
    if (Math.floor(rating) >= circle) {
      return 'full-circle';
    } else if (Math.floor(rating) < circle && Math.ceil(rating) >= circle) {
      return 'half-circle';
    } else {
      return 'empty-circle';
    }
  }

  /**
   * Get formatted score for display
   */
  getFormattedScore(score: number): string {
    return score.toFixed(1);
  }

  /**
   * Get color for score based on value
   */
  getScoreColor(score: number): string {
    if (score >= 4.0) return '#4CAF50'; // Green
    if (score >= 3.0) return '#FF9800'; // Orange
    if (score >= 2.0) return '#F44336'; // Red
    return '#9E9E9E'; // Grey
  }

  /**
   * Get season display text
   */
  getSeasonDisplay(season: string): string {
    const seasonMap: { [key: string]: string } = {
      S1: 'Semester 1',
      S2: 'Semester 2',
      SS: 'Summer School',
      WS: 'Winter School',
    };

    const parts = season.split('_');
    if (parts.length === 2) {
      const year = parts[0];
      const sem = parts[1];
      return `${year} ${seasonMap[sem] || sem}`;
    }
    return season;
  }

  /**
   * Get response rate percentage
   */
  getResponseRatePercent(setu: Setu): number {
    if (setu.Invited === 0) return 0;
    return Math.round((setu.Responses / setu.Invited) * 100);
  }

  /**
   * Get tooltip description for each SETU criteria
   */
  getCriteriaTooltip(criteriaKey: string): string {
    const tooltips: { [key: string]: string } = {
      I1: 'How clearly the learning outcomes were communicated to students',
      I2: 'How clearly assessment tasks and requirements were explained',
      I3: 'How well assessment tasks aligned with and demonstrated the learning outcomes',
      I4: 'How effectively feedback helped students achieve the learning outcomes',
      I5: 'How well the provided resources supported achievement of learning outcomes',
      I6: 'How effectively learning activities helped students achieve the outcomes',
      I7: "Students' self-assessment of their engagement level in the unit",
      I8: 'Overall satisfaction with the unit experience',
      I9: 'How well assessment tasks developed knowledge and skills',
      I10: 'How clearly students could see connections between different topics',
      I11: 'The balance between theoretical content and practical application',
      I12: 'How much the unit encouraged students to actively participate',
      I13: "How effectively the unit improved students' critical thinking abilities",
    };
    return tooltips[criteriaKey] || 'SETU evaluation criteria';
  }


  
  /** 
   *  ! |======================================================================|
   *  ! | META TAGS                                                            
   *  ! |======================================================================|
   */

  /**
   * * Update meta tags for SEO and social sharing
   */
  private updateMetaTags(): void {
    if (!this.unitCode) {
      console.warn('Cannot update meta tags: Unit code is not available');
      return;
    }

    const selectedSetu = this.getSelectedSetu();
    const aggregateScore = selectedSetu?.getAggregateScore();
    const season = selectedSetu ? this.getSeasonDisplay(selectedSetu.Season) : undefined;
    const pageUrl = `${BASE_URL}/setu/${this.unitCode}`;

    // Basic meta tags
    this.titleService.setTitle(getMetaSetuOverviewTitle(this.unitCode.toUpperCase()));
    this.meta.updateTag({ name: 'description', content: getMetaSetuOverviewDescription(this.unitCode.toUpperCase(), season) });
    this.meta.updateTag({ name: 'keywords', content: getMetaSetuOverviewKeywords(this.unitCode.toUpperCase()) });

    // Open Graph tags for social sharing
    this.meta.updateTag({ property: 'og:title', content: getMetaSetuOverviewOpenGraphTitle(this.unitCode.toUpperCase()) });
    this.meta.updateTag({ property: 'og:description', content: getMetaSetuOverviewOpenGraphDescription(this.unitCode.toUpperCase(), aggregateScore) });
    this.meta.updateTag({ property: 'og:url', content: pageUrl });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    
    // Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: getMetaSetuOverviewTwitterTitle(this.unitCode.toUpperCase()) });
    this.meta.updateTag({ name: 'twitter:description', content: getMetaSetuOverviewTwitterDescription(this.unitCode.toUpperCase(), aggregateScore) });

    console.log('[SETU Overview] Meta tags updated');
  }
}
