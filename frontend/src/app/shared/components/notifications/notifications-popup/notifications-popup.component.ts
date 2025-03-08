import { Component, Input } from '@angular/core';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ButtonModule } from 'primeng/button';
import { User } from '../../../models/user.model';
import { NotificationCardComponent } from '../notification-card/notification-card.component';
import { CommonModule } from '@angular/common';
import { Notification } from '../../../models/notification.model';
import { BadgeModule } from 'primeng/badge';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-notifications-popup',
  standalone: true,
  imports: [
    OverlayPanelModule,
    ButtonModule,
    NotificationCardComponent,
    CommonModule,
    BadgeModule,
  ],
  templateUrl: './notifications-popup.component.html',
  styleUrl: './notifications-popup.component.scss',
})
export class NotificationsPopupComponent {
  @Input()
  profileColor!: string;

  // & |==== User Data ====|
  user: User | null = null;
  notifications: Notification[] = [];

  // & |==== Subscriptions ====|
  private userSubscription: Subscription = new Subscription();

  /**
   * ! Constructor
   *
   * @param apiService The API service
   * @param authService The Auth service
   */
  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  /**
   * * Runs on Init
   *
   * Subscribes to the current user observable to get user notifications
   */
  ngOnInit(): void {
    this.userSubscription = this.authService.getCurrentUser().subscribe({
      next: (currentUser: User | null) => {
        this.user = currentUser;
        console.log('NotificationPopup | Current User:', this.user);

        // Gets user notifications if user not null
        if (this.user?._id) {
          this.getUserNotifications(this.user._id);
        }
      },
    });
  }

  /**
   * * Runs on destroy
   */
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  /**
   *  ! |======================================================================|
   *  ! | NOTIFICATION HANDLERS                                                     |
   *  ! |======================================================================|
   */

  /**
   * * Gets the user's notifications
   *
   * Called to get the user's notifications. Will call the backend API to get the user's
   * notifications and store them in the notifications array.
   *
   * @subscribes apiService.getUserNotificationsGET(userID)
   */
  getUserNotifications(userID: any) {
    this.apiService.getUserNotificationsGET(userID).subscribe(
      (notifications: Notification[]) => {
        this.notifications = notifications;

        // Update the notifications property in the user object
        if (this.user) this.user.notifications = this.notifications;

        console.log(this.notifications);
      },
      (error: any) => {
        // ? Debug log: Error
        console.log('ERROR DURING: GET Get All notifications', error);
      }
    );
  }

  removeNotification(notification: Notification) {
    // call the api service to mark the notification as read, and then remove it from notifications[]
    this.apiService.deleteNotificationByIdDELETE(notification._id).subscribe({
      next: () => {
        this.user?.removeNotification(notification._id);
        this.notifications = this.notifications.filter(
          (n) => n._id !== notification._id
        );
        console.log('Notification successfully removed');
      },
      error: (error) => {
        // ? Debug log error
        console.error('Error while toggling like:', error);
      },
    });
  }
}
