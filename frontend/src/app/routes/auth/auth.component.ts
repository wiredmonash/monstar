import { AsyncPipe, DOCUMENT } from '@angular/common';
import { Component, HostListener, inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReviewCardComponent } from '@components/review-card/review-card.component';
import { ShinyMonstarTitleComponent } from '@components/shiny-monstar-title/shiny-monstar-title.component';
import { GetReviewService } from '@services/api/get-review.service';
import { UserService } from '@services/api/user.service';
import { IReviewFullyPopulated } from 'app/shared/models/v2/review.schema';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { map } from 'rxjs';
import { AuthGoogleButtonComponent } from './auth-google-button/auth-google-button.component';

interface State {
  reviews: IReviewFullyPopulated[];
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    AuthGoogleButtonComponent,
    ShinyMonstarTitleComponent,
    DividerModule,
    ReviewCardComponent,
    AsyncPipe,
    SkeletonModule,
    RouterLink,
  ],
  providers: [MessageService],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);
  private router = inject(Router);

  showLeftPanel = window.innerWidth >= 1130;

  ngOnInit(): void {
    this.renderer.addClass(this.document.body, 'no-scroll');
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(this.document.body, 'no-scroll');
  }

  @HostListener('window:resize')
  onResize() {
    this.showLeftPanel = window.innerWidth >= 1130;
  }

  private getReviewService = inject(GetReviewService);

  state$ = this.getReviewService.getMostLiked().pipe(
    map((reviews: IReviewFullyPopulated[]) => {
      const state: State = {
        reviews: [],
      };
      if (!reviews || reviews.length == 0) {
        return state;
      }
      state.reviews = reviews;
      return state;
    })
  );

  onGoogleCredential(idToken: string) {
    this.userService.googleAuthenticate(idToken).subscribe({
      next: () => this.router.navigate(['/list']),
      error: () =>
        this.messageService.add({
          severity: 'error',
          summary: 'Error signing in',
          detail: 'It did not work for some reason lol :()',
        }),
    });
  }

  onGuestLinkClick() {
    return this.router.navigate(['/list']);
  }
}
