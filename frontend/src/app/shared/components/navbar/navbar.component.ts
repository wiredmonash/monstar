import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, ViewChild } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Allows us to go to different routes
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
    ToastModule
  ],
  providers: [
    provideAnimations(),
    MessageService
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  // Reference to the sidebar child
  @ViewChild('sidebarRef') sidebarRef!: Sidebar;

  // Visibility state of the sidebar
  sidebarVisible: boolean = false;

  // Title of the profile dialog
  profileDialogTitle: string = '';
  // Visibility state of the profile dialog
  profileDialogVisible: boolean = false;

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
   * * Shows the profile dialog
   */
  showProfileDialog() {
    this.profileDialogVisible = true;
  }

  /**
   * * Updates the profile dialog title (called on titleChangeEvent from profile.component)
   * 
   * @param title - The new title of the profile dialog
   */
  updateProfileDialogTitle(title: string) {
    this.profileDialogTitle = title;
  }

  /**
   * * Called when the profile auth state is changed.
   */
  authStateChange(state: string) {
    if (state == 'signed up') {
      // Close the profile dialog
      this.profileDialogVisible = false;

      // Show toast 
      this.messageService.add({ severity: 'success', summary: 'Signed Up & Logged in!', detail: 'You have signed up & logged in.' });
    }
  }
}
