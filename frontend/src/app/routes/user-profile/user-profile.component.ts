import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewCardComponent } from '@components/review-card/review-card.component';
import { DeleteReviewService } from '@services/api/delete-review.service';
import { GetReviewService } from '@services/api/get-review.service';
import { ModifyReviewService } from '@services/api/modify-review.service';
import { UserService } from '@services/api/user.service';
import { DEFAULT_PROFILE_IMG } from 'app/shared/constants/constants';
import { IUpdateReview } from 'app/shared/models/v2/review.schema';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { ProfilePanelComponent } from './profile-panel/profile-panel.component';
import { State } from './user-profile.state';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    AsyncPipe,
    ProfilePanelComponent,
    ReviewCardComponent,
    SkeletonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  private userService = inject(UserService);
  private getReviewService = inject(GetReviewService);
  private modifyReviewService = inject(ModifyReviewService);
  private deleteReviewService = inject(DeleteReviewService);
  private messageService = inject(MessageService);

  private refreshReviews$ = new BehaviorSubject<void>(undefined);

  state$: Observable<State> = combineLatest([
    this.route.paramMap,
    this.userService.currentUser$,
    this.refreshReviews$,
  ]).pipe(
    map(([params, currUser, _]) => [params, currUser] as const),
    switchMap(([params, currUser]) => {
      const username = params.get('username');
      if (!username) {
        return of({ user: null, currUser, reviews: [] });
      }

      const isSameUser = currUser && currUser.username === username;

      const userSource$ = isSameUser
        ? of(currUser)
        : this.userService
            .getByUsername(username)
            .pipe(catchError(() => of(null)));

      return userSource$.pipe(
        switchMap((user) => {
          if (!user) return of({ user: null, currUser, reviews: [] });

          return this.getReviewService.getReviewsByUser(user._id).pipe(
            map((reviews) => ({
              user,
              currUser,
              // Map user as author to make it a IReviewAuthorPopulated type
              reviews: reviews.map((r) => ({ ...r, author: user })),
            })),
            catchError(() => of({ user, currUser, reviews: [] }))
          );
        })
      );
    }),
    map(({ user, currUser, reviews }) => ({
      username: user?.username ?? null,
      authcate: user?.email?.slice(0, 8) ?? null,
      user: user ?? null,
      profileImg: user?.profileImg ?? DEFAULT_PROFILE_IMG,
      isCurrentUser:
        !!user && !!currUser && user.username === currUser.username,
      reviews: reviews.sort((a, b) => {
        // Sorting reviews by their unitcode digit
        const levelA = parseInt(a.unit.unitCode[3]);
        const levelB = parseInt(b.unit.unitCode[3]);
        return (
          levelA - levelB || a.unit.unitCode.localeCompare(b.unit.unitCode)
        );
      }),
    })),
    shareReplay(1)
  );

  onEditReview(review: IUpdateReview) {
    this.modifyReviewService
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

  onDeleteReview(reviewId: string) {
    this.deleteReviewService
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

  onUsernameSaved(newUsername: string) {
    this.messageService.add({
      severity: 'success',
      summary: 'Username updated!',
      detail: `You are now known as ${newUsername}`,
    });
    this.router.navigate(['/user', newUsername]);
  }

  logout() {
    this.userService.logout().subscribe(() => {
      this.router.navigate(['/']);
    });
  }

  deleteAccount() {
    const userId = this.userService.getId();
    if (!userId) return;

    this.userService.deleteAccount(userId).subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}
