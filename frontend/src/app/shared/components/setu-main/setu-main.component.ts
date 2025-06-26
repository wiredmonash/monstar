import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { SetuService } from '../../services/setu.service';
import { Setu } from '../../models/setu.model';
import { ViewportService, ViewportType } from '../../services/viewport.service';

@Component({
  selector: 'app-setu-main',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ProgressSpinnerModule,
    SkeletonModule,
    TooltipModule,
    ButtonModule,
    BadgeModule,
    DividerModule,
  ],
  templateUrl: './setu-main.component.html',
  styleUrl: './setu-main.component.scss',
})
export class SetuMainComponent implements OnInit, OnDestroy {
  unitCode: string = '';
  setuData: Setu[] = [];
  loading = true;
  error: string | null = null;
  viewportType: ViewportType = 'desktop';
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private setuService: SetuService,
    private viewportService: ViewportService
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
  }

  /**
   * Load SETU data for the unit
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
          this.loading = false;
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
}
