import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule, SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { ModifyReviewService } from '@services/api/modify-review.service';
import { UserService } from '@services/api/user.service';
import {
  IReview,
  IReviewAuthorPopulated,
  IReviewFullyPopulated,
  IUpdateReview,
  UpdateReviewSchema,
} from 'app/shared/models/v2/review.schema';
import { IUnit } from 'app/shared/models/v2/unit.schema';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopup, ConfirmPopupModule } from 'primeng/confirmpopup';
import { MenuModule } from 'primeng/menu';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { combineLatest, map, ReplaySubject, Subscription } from 'rxjs';
import { HighlightUnitPipe } from '../../pipes/highlight-unit.pipe';
import { ViewportService, ViewportType } from '../../services/viewport.service';
import { WriteReviewUnitComponent } from '../write-review-unit/write-review-unit.component';

@Component({
  selector: 'app-review-card',
  standalone: true,
  imports: [
    SlicePipe,
    AvatarModule,
    CommonModule,
    ProgressSpinnerModule,
    ConfirmPopupModule,
    ButtonModule,
    MenuModule,
    TooltipModule,
    BadgeModule,
    WriteReviewUnitComponent,
    HighlightUnitPipe,
    RouterLink,
  ],
  providers: [ConfirmationService],
  templateUrl: './review-card.component.html',
  styleUrl: './review-card.component.scss',
  animations: [
    // Fade in out animation for delete button
    trigger('fadeInOut', [
      state(
        'hidden',
        style({
          opacity: 0,
        })
      ),
      state(
        'visible',
        style({
          opacity: 1,
        })
      ),
      transition('hidden <=> visible', animate('300ms ease-in-out')),
    ]),
  ],
})
export class ReviewCardComponent implements OnInit, OnDestroy {
  Math = Math;

  @Input() variant: 'default' | 'compact' | 'profile' = 'default';

  private review$ = new ReplaySubject<IReviewAuthorPopulated>(1);
  private _review: IReviewAuthorPopulated | IReviewFullyPopulated | undefined;
  @Input({ required: true })
  set review(value: IReviewAuthorPopulated) {
    this._review = value;
    this.review$.next(value);
  }
  get review(): IReviewAuthorPopulated | undefined {
    return this._review;
  }

  @Input({ required: true }) unit: IUnit | undefined;

  @Output() reviewDeleted = new EventEmitter<string>();
  @Output() reviewEdited = new EventEmitter<IUpdateReview>();

  @ViewChild(ConfirmPopup) confirmPopup!: ConfirmPopup;

  // Child component: write review unit dialog
  @ViewChild(WriteReviewUnitComponent)
  writeReviewDialog!: WriteReviewUnitComponent;

  dropdownMenuItems: MenuItem[] | undefined;

  // Expand state
  expanded: boolean = false;

  liked: boolean = false;
  hoveringLike: boolean = false;
  likes: number = 0;
  // Disliking
  disliked: boolean = false;
  hoveringDislike: boolean = false;
  dislikes: number = 0;

  // Delete button visibility state
  deleteButtonState: 'visible' | 'hidden' = 'hidden';

  defaultProfileImg =
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWwfGUCDwrZZK12xVpCOqngxSpn0BDpq6ewQ&s';

  private viewportSubscription: Subscription = new Subscription();
  viewportType: ViewportType = 'desktop';

  // Inputted to child in template (write-review-unit)
  reviewEdit: IUpdateReview = UpdateReviewSchema.safeParse({
    _id: '',
    author: '',
  }).data!;
  startEditReview(review: IReviewAuthorPopulated) {
    this.reviewEdit = UpdateReviewSchema.parse({
      ...review,
      author: typeof review.author === 'object' ? review.author._id : review.author,
    });
    if (this.writeReviewDialog) {
      this.writeReviewDialog.openDialog();
    }
  }

  private userService = inject(UserService);
  private modifyReviewService = inject(ModifyReviewService);
  private confirmationService = inject(ConfirmationService);
  private viewportService = inject(ViewportService);

  readonly state$ = combineLatest([
    this.userService.currentUser$,
    this.review$,
  ]).pipe(
    map(([user, review]) => {
      if (!user) return null;
      if (!review) return null;
      return {
        reviewLikes: review.likes,
        reviewDislikes: review.dislikes,

        liked: user.likedReviews.includes(review._id) ?? false,
        disliked: user.dislikedReviews.includes(review._id) ?? false,
        isAuthor:
          user._id ===
          (typeof review.author === 'object'
            ? review.author._id
            : review.author),
        profileImg: review.author.profileImg,
        username: review.author.username,
      };
    })
  );

  ngOnInit(): void {
    this.viewportSubscription = this.viewportService.viewport$.subscribe(
      (type) => {
        this.viewportType = type;
      }
    );

    this.dropdownMenuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => {
          if (!this.review) return;
          this.startEditReview(this.review);
        },
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => {
          this.deleteReview();
        },
      },
    ];
  }

  ngOnDestroy(): void {
    this.viewportSubscription.unsubscribe();
  }

  /* ----------------------------- Review deletion ---------------------------- */

  accept() {
    this.confirmPopup.accept();
  }
  reject() {
    this.confirmPopup.reject();
  }

  confirmDeletion(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure?',
      accept: () => {
        this.deleteReview();
      },
      reject: () => {},
    });
  }

  deleteReview() {
    if (!this.review) return;
    this.reviewDeleted.emit(this.review._id);
  }

  /* -------------------------- Liking and disliking -------------------------- */

  toggleReaction(reactionType: 'like' | 'dislike') {
    if (!this.review) return;
    const reviewId = this.review._id;
    const rollback = this.userService.toggleReaction(reviewId, reactionType);
    const userId = this.userService.getId();
    if (!userId) {
      console.error('User id was not retrieved');
      return;
    }

    this.modifyReviewService
      .toggleReaction(reviewId, userId, reactionType)
      .subscribe({
        next: (updatedReview: IReview) => {
          this.review = {
            ...this.review,
            likes: updatedReview.likes,
            dislikes: updatedReview.dislikes,
          } as IReviewAuthorPopulated;
        },
        error: () => {
          if (rollback) rollback();
        },
      });
  }

  /* ----------------------------- Helper methods ----------------------------- */

  toggleExpand() {
    this.expanded = !this.expanded;
  }
}
