import { Component, EventEmitter, HostListener, OnInit, Output, ViewChild } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { Sidebar, SidebarModule } from 'primeng/sidebar';
import { StyleClassModule } from 'primeng/styleclass';
import { Dialog, DialogModule } from 'primeng/dialog';
import { ProfileComponent } from '../profile/profile.component';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { User } from '../../models/user.model';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { filter } from 'rxjs/operators';
import { ViewportService, ViewportType } from '../../services/viewport.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    SidebarModule,
    ButtonModule,
    RippleModule,
    StyleClassModule,
    AvatarModule,
    DialogModule,
    ProfileComponent,
    ToastModule,
    TooltipModule,
    BadgeModule,
  ],
  providers: [
    MessageService
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  // Reference to the sidebar child
  @ViewChild('sidebarRef') sidebarRef!: Sidebar;

  // Reference to the profile dialog
  @ViewChild('profileDialog') profileDialog!: Dialog;

  // ! Event emitter for opening/closing the dialog  THIS COULD CAUSE LAG ()_() !!!!!!!!!
  @Output() dialogClosedEvent = new EventEmitter<void>();
  @Output() dialogOpenedEvent = new EventEmitter<void>();

  // Visibility state of the sidebar
  sidebarVisible: boolean = false;

  // Username for the sidebar
  username: string | undefined = '';

  // Saves the profile state
  profileState: 'logged out' | 'logged in' | 'signed out' | 'signed up' | 'forgot password' = 'signed out';
  // Title of the profile dialog
  profileDialogTitle: string = 'Sign Up';
  // Visibility state of the profile dialog
  profileDialogVisible: boolean = false;

  // The color of the navbar background (changes based on route)
  navbarColor: string = 'var(--primary-color)';
  // The color of the title (changes based on route)
  titleColor: string = 'var(--primary-color)';
  // The color of the hamburger menu icon (changes based on route)
  hamburgColor: string = 'black';
  // The color of the profile icon (changes based on route)
  profileColor: string = 'black';

  // Current user
  user: User | null = null;

  // Viewport type
  viewportType: ViewportType = 'desktop';
  
  /**
   * ! Constructor
   * 
   * Navigation event listener to update the navbar colour
   * 
   * @param messageService The message service
   * @param router The router service
   * @param viewportService The viewport service  
   */
  constructor (
    private messageService: MessageService,
    private router: Router,
    private viewportService: ViewportService
  ) {
    // Subscribes to changes in navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Update the navbar color
      this.updateNavbarColor();
    });
  }

  /**
   * * On Initalisation
   * 
   * - Updates the navbar color
   * - Subcribes to viewport changes
   */
  ngOnInit() {  
    this.updateNavbarColor();

    // Subscribe to viewport changes
    this.viewportService.viewport$.subscribe(type => { 
      this.viewportType = type; 
    });
  }

  /**
   * * Updates the navbar color
   * 
   * This method updates the navbar color based no the current route.
   */
  private updateNavbarColor() {
    this.navbarColor = this.router.url === '/' ? 'var(--primary-color)' : 'var(--fg-dark-color)';
    this.titleColor = this.router.url === '/' ? 'black' : 'var(--primary-color)';
    this.hamburgColor = this.router.url === '/' ? 'black' : 'white';
    this.profileColor = this.router.url === '/' ? 'black' : 'white';
  }

  /** 
   * * Keybinds
   * 
   * This method listens for key presses and performs actions based on the key press.
   * 
   * - Open and close the profile dialog with CTRL + P
   * - Open and close the sidebar with CTRL + S
   * 
   * @param event The keyboard event
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // If the user presses 'p' then we open the profile dialog
    if (event.ctrlKey && event.key === 'p') {
      event.preventDefault();

      if (!this.profileDialogVisible) {
        this.showProfileDialog();
        this.sidebarVisible = false;
      } else {
        this.profileDialogVisible = false;
        //this.onDialogClose();
      }
    }

    // If the user presses 's' then we open the sidebar
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();

      if (!this.sidebarVisible) {
        this.sidebarVisible = true;
        this.profileDialogVisible = false;
      } else {
        this.sidebarVisible = false;
      }
    }
  }

  /**
   * * Closes the sidebar
   */
  closeCallback(e: any): void {
    this.sidebarRef.close(e);
  }

  /**
   * * Called when the dialog is closed
   * 
   * @event dialogClosedEvent Event emitter for when the dialog is closed.
   */
  onDialogClose() {
    // Emit to children that we closed the dialog
    this.dialogClosedEvent.emit();

    // If the user is in the signed up state, meaning the profile dialog shows
    // 'Verify your email', then if we close the dialog the profile dialog 
    // will show the login page next time it is opened.
    if (this.profileState == 'signed up') {
      this.profileState = 'logged out';
    }
  }

  /**
   * * Called when the dialog is opened
   * 
   * @event dialogOpenedEvent Event emitter for when the dialog is opened.
   * @param dialog The dialog that was opened.
   */
  onDialogOpen(dialog: Dialog) {
    this.profileDialog = dialog;

    // if (dialog && this.profileState !== 'logged in' && this.viewportType === 'mobile') { 
    //   dialog.maximize(); 
    // }

    if (dialog && this.profileState === 'logged in' && (this.viewportType === 'laptop' || this.viewportType === 'tablet' || this.viewportType === 'mobile')) {
      dialog.maximize();
    }

    this.dialogOpenedEvent.emit();
  }

  /**
   * * Shows the profile dialog
   */
  showProfileDialog() {
    this.profileDialogVisible = true;
  }

  /**
   * * Called when the profile auth state is changed.
   */
  authStateChange(state: 'logged out' | 'logged in' | 'signed out' | 'signed up' | 'forgot password') {
    this.profileState = state;

    switch (state) {
      case 'logged in':
        this.username = this.user?.username;
        break;

      case 'logged out':
        this.username = 'Login (Guest)';
        break;
    }
  }

  /**
   * * Method to create a toast
   */
  handleToastEvent(event: { severity: string, summary: string, detail: string }) {
    this.messageService.add({ severity: event.severity, summary: event.summary, detail: event.detail });
  }
}
