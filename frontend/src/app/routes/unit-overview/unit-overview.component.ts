import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GetUnitService } from '@services/api/get-unit.service';
import { ReviewService } from '@services/api/review.service';
import { UserService } from '@services/api/user.service';
import { SeoService } from '@services/seo.service';
import {
  ICreateReview,
  IReview,
  IReviewAuthorPopulated,
  IUpdateReview,
} from 'app/shared/models/v2/review.schema';
import { IUnitDeeplyPopulated } from 'app/shared/models/v2/unit.schema';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  exhaustMap,
  filter,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { AiOverviewComponent } from '../../shared/components/ai-overview/ai-overview.component';
import { ReviewCardComponent } from '../../shared/components/review-card/review-card.component';
import { UnitReviewHeaderComponent } from '../../shared/components/unit-review-header/unit-review-header.component';
import {
  BASE_URL,
  getMetaUnitOverviewDescription,
  getMetaUnitOverviewKeywords,
  getMetaUnitOverviewOpenGraphDescription,
  getMetaUnitOverviewOpenGraphTitle,
  getMetaUnitOverviewTitle,
  getMetaUnitOverviewTwitterDescription,
  getMetaUnitOverviewTwitterTitle,
} from '../../shared/constants/constants';

@Component({
  selector: 'app-unit-overview',
  standalone: true,
  imports: [
    ReviewCardComponent,
    UnitReviewHeaderComponent,
    AiOverviewComponent,
    ToastModule,
    ProgressSpinnerModule,
    SkeletonModule,
    ScrollPanelModule,
    CommonModule,
    FormsModule,
  ],
  providers: [MessageService],
  templateUrl: './unit-overview.component.html',
  styleUrl: './unit-overview.component.scss',
})
export class UnitOverviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('headerSkeleton') headerSkeleton!: ElementRef;
  @ViewChild('unitOverviewContainer') unitOverviewContainer!: ElementRef;

  isSplitView: boolean = false;
  splitViewMinWidth: number = 1414;

  private destroyRef = inject(DestroyRef);

  private resizeHandler = () => {
    this.isSplitView = window.innerWidth >= this.splitViewMinWidth;
    this.updateContainerHeight();
  };

  private getUnitService = inject(GetUnitService);
  private reviewService = inject(ReviewService);
  private messageService = inject(MessageService);
  private userService = inject(UserService);
  private seo = inject(SeoService);
  private route = inject(ActivatedRoute);

  private refreshReviews$ = new BehaviorSubject<void>(undefined);
  private sortCriteria$ = new BehaviorSubject<string>('most-likes');

  private unitCode$: Observable<string | null> = this.route.paramMap.pipe(
    map((params) => params.get('unitcode'))
  );

  private rawUnit$: Observable<IUnitDeeplyPopulated | null> = combineLatest([
    this.unitCode$,
    this.refreshReviews$,
  ]).pipe(
    map(([code, _]) => code),
    switchMap((code) => {
      if (!code) return of(null);

      const populateReviews = true;
      const populateReviewsAuthor = true;
      return this.getUnitService
        .getByUnitcode(code, populateReviews, populateReviewsAuthor)
        .pipe(
          tap((unit) => {
            this.updateMetaTags(unit);
            this.resetScrollPosition();
            this.updateContainerHeight();
          }),
          catchError(() => of(null))
        );
    }),
    shareReplay(1)
  );

  unitData$: Observable<IUnitDeeplyPopulated | null> = combineLatest([
    this.rawUnit$,
    this.sortCriteria$,
  ]).pipe(
    map(([unit, criteria]) => {
      if (!unit) return null;
      return {
        ...unit,
        reviews: this.sortReviews(unit.reviews, criteria),
      };
    })
  );

  ngOnInit(): void {
    this.isSplitView = window.innerWidth >= this.splitViewMinWidth;
  }

  ngAfterViewInit(): void {
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
    this.unitOverviewContainer.nativeElement.style.height = '';
    this.seo.clear();
  }

  setSort(criteria: string): void {
    this.sortCriteria$.next(criteria);
  }

  private sortReviews(
    reviews: IReviewAuthorPopulated[],
    criteria: string
  ): IReviewAuthorPopulated[] {
    const reviewsClone = [...reviews];

    switch (criteria) {
      case 'oldest':
        return reviewsClone.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case 'recent':
        return reviewsClone.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'lowest-rating':
        return reviewsClone.sort((a, b) => a.overallRating - b.overallRating);
      case 'highest-rating':
        return reviewsClone.sort((a, b) => b.overallRating - a.overallRating);
      case 'most-likes':
        return reviewsClone.sort(
          (a, b) => b.likes - b.dislikes - (a.likes - a.dislikes)
        );
      case 'most-dislikes':
        return reviewsClone.sort(
          (a, b) => a.likes - a.dislikes - (b.likes - b.dislikes)
        );
      default:
        return reviewsClone;
    }
  }

  onDeleteReview(reviewId: string) {
    this.reviewService
      .deleteById(reviewId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Review removed successfully',
          });
          this.userService.removeReview(reviewId);
          this.refreshReviews$.next();
        })
      )
      .subscribe();
  }

  onAddReview(review: ICreateReview) {
    this.unitCode$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        take(1),
        filter((code) => code !== null),
        exhaustMap((unitCode) => {
          return this.reviewService.createReview(unitCode, review);
        }),
        tap((newReview: IReview) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Review submitted!',
            detail: 'Review has been published publicly',
          });
          this.userService.addReview(newReview._id);
          this.refreshReviews$.next();
        })
      )
      .subscribe();
  }

  onEditReview(review: IUpdateReview) {
    this.reviewService
      .editReview(review)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Review updated!',
            detail: 'Your changes have been saved',
          });
          this.refreshReviews$.next();
        })
      )
      .subscribe();
  }

  /* ------------------------------- UI updates ------------------------------- */

  /**
   * Updates unit overview container height
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
   * Reset scroll position on all possible containers
   */
  private resetScrollPosition(): void {
    console.log('Resetting scroll position');

    // Reset main window scroll
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    // Reset any scroll panels
    const scrollContainers = document.querySelectorAll(
      '.p-scrollpanel-content, .p-scrollpanel-wrapper'
    );
    scrollContainers.forEach((container) => {
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

  /* -------------------------------- Meta tags ------------------------------- */

  updateMetaTags(unit: IUnitDeeplyPopulated): void {
    const unitReviewsCount: number = unit.reviews.length;
    const unitAverageRating: number = +unit.avgOverallRating.toFixed(1);
    const unitCode: string = unit.unitCode.toUpperCase();
    const unitName: string = unit.name;
    const pageUrl: string = `${BASE_URL}/unit/${unit.unitCode}`;

    this.seo.set(
      getMetaUnitOverviewTitle(unitCode, unitName),
      {
        description: getMetaUnitOverviewDescription(
          unitReviewsCount,
          unitCode,
          unitName
        ),
        keywords: getMetaUnitOverviewKeywords(unitCode, unitName),
        'og:title': getMetaUnitOverviewOpenGraphTitle(unitCode, unitName),
        'og:description': getMetaUnitOverviewOpenGraphDescription(
          unitCode,
          unitAverageRating,
          unitReviewsCount
        ),
        'og:url': pageUrl,
        'og:type': 'website',
        'twitter:card': 'summary',
        'twitter:title': getMetaUnitOverviewTwitterTitle(unitCode),
        'twitter:description': getMetaUnitOverviewTwitterDescription(
          unitCode,
          unitName,
          unitAverageRating
        ),
      },
      // Canonical URL pointing at this unit (overrides the homepage default in
      // index.html) so Google indexes each unit page as its own page.
      pageUrl
    );
  }
}
