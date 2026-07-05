import { AsyncPipe } from '@angular/common';
import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { UserService } from '@services/api/user.service';
import { IUser } from 'app/shared/models/v2/user.schema';
import { MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { NavigationService } from '../../services/navigation.service';
import { ViewportService, ViewportType } from '../../services/viewport.service';
import { NotificationsPopupComponent } from '../notifications/notifications-popup/notifications-popup.component';

export interface State {
  isAuthenticated: boolean;
  user: IUser | null;
}

interface RailLink {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    ButtonModule,
    RippleModule,
    StyleClassModule,
    AvatarModule,
    DialogModule,
    ToastModule,
    TooltipModule,
    BadgeModule,
    NotificationsPopupComponent,
    AsyncPipe,
  ],
  providers: [MessageService],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  sidebarExpanded = signal(false);

  readonly railLinks: RailLink[] = [
    { label: 'Home', icon: 'pi pi-home', route: '/' },
    { label: 'Units', icon: 'pi pi-graduation-cap', route: '/list' },
    { label: 'Student Roles', icon: 'pi pi-briefcase', route: '/jobs' },
    { label: 'Changelog', icon: 'pi pi-sitemap', route: '/changelog' },
    { label: 'Contributions', icon: 'pi pi-info-circle', route: '/about' },
    { label: 'Ts & Cs', icon: 'pi pi-shield', route: '/terms-and-conditions' },
  ];

  username: string | undefined = '';

  navbarColor: string = 'var(--fg-dark-color)';
  titleColor: string = 'var(--primary-color)';
  hamburgColor: string = 'white';
  profileColor: string = 'white';

  viewportType: ViewportType = 'desktop';

  private messageService = inject(MessageService);
  private userService = inject(UserService);
  private viewportService = inject(ViewportService);
  private navigationService = inject(NavigationService);
  private router = inject(Router);

  state$: Observable<State> = this.userService.currentUser$.pipe(
    map((user: IUser | null) => {
      const state: State = {
        isAuthenticated: false,
        user: null,
      };
      if (!user) return state;

      state.isAuthenticated = user ? true : false;
      state.user = user;
      return state;
    })
  );

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateNavbarColor();
      });
  }

  ngOnInit(): void {
    this.updateNavbarColor();

    this.viewportService.viewport$.subscribe((type) => {
      this.viewportType = type;
    });
  }

  /**
   * Updates the navbar color based n the current route
   */
  private updateNavbarColor(): void {
    this.navbarColor =
      this.router.url === '/' ? 'var(--primary-color)' : 'var(--fg-dark-color)';
    this.titleColor =
      this.router.url === '/' ? 'black' : 'var(--primary-color)';
    this.hamburgColor = this.router.url === '/' ? 'black' : 'white';
    this.profileColor = this.router.url === '/' ? 'black' : 'white';
  }

  clickedProfileIcon() {
    const user = this.userService.currentUserValue;
    if (!user) {
      this.router.navigate(['/auth']);
      return;
    }
    return this.router.navigate(['/user/' + user.username]);
  }

  // Toggles the sidebar rail on CTRL+S
  @HostListener('document:keydown.control.s', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    event.preventDefault();
    this.toggleSidebar();
  }

  toggleSidebar(): void {
    this.sidebarExpanded.update((expanded) => !expanded);
  }

  /**
   * Method to create a toast
   *
   * This method creates a toast with the provided event data.
   *
   * @param event The event data for the toast
   * @event messageService The message service will display the toast.
   */
  handleToastEvent(event: {
    severity: string;
    summary: string;
    detail: string;
  }) {
    this.messageService.add({
      severity: event.severity,
      summary: event.summary,
      detail: event.detail,
    });
  }

  /**
   * Navigates to a page from the rail (collapses it, scrolls to top)
   */
  navigateTo(route: string) {
    this.sidebarExpanded.set(false);
    this.navigationService.navigateTo([route]);
  }
}
