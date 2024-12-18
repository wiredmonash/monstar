import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { Sidebar, SidebarModule } from 'primeng/sidebar';
import { StyleClassModule } from 'primeng/styleclass';
import { DialogModule } from 'primeng/dialog';
import { ProfileComponent } from '../profile/profile.component';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { User } from '../../models/user.model';
import { TooltipModule } from 'primeng/tooltip';

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
    TooltipModule
  ],
  providers: [
    MessageService
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  // Reference to the sidebar child
  @ViewChild('sidebarRef') sidebarRef!: Sidebar;

  // ! Event emitter for closing the dialog  THIS COULD CAUSE LAG ()_() !!!!!!!!!
  @Output() dialogClosedEvent = new EventEmitter<void>();

  // Visibility state of the sidebar
  sidebarVisible: boolean = false;

  // Username for the sidebar
  username: string | undefined = '';

  // Saves the profile state
  profileState: 'logged out' | 'logged in' | 'signed out' | 'signed up' = 'signed out';
  // Title of the profile dialog
  profileDialogTitle: string = 'Sign Up';
  // Visibility state of the profile dialog
  profileDialogVisible: boolean = false;

  // Current user
  user: User | null = null;


  // ! Injects MessageService
  constructor (
    private messageService: MessageService
  ) {}

  /**
   * * Closes the sidebar
   */
  closeCallback(e: any): void {
    this.sidebarRef.close(e);
  }

  /**
   * * On close of the dialog
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
   * * Shows the profile dialog
   */
  showProfileDialog() {
    this.profileDialogVisible = true;
  }

  /**
   * * Called when the profile auth state is changed.
   */
  authStateChange(state: 'logged out' | 'logged in' | 'signed out' | 'signed up') {
    this.profileState = state;

    switch (state) {
      case 'signed up':
        this.messageService.add({ severity: 'info', summary: 'Signed Up', detail: 'You have signed up, now you must confirm your email!' });
        break;

      case 'logged in':
        this.messageService.add({ severity: 'success', summary: 'Logged in', detail: 'You are logged in!'});
        this.username = this.user?.username;
        break;

      case 'logged out':
        this.messageService.add({ severity: 'warn', summary: 'Logged out!', detail: 'You are logged out!'});
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
