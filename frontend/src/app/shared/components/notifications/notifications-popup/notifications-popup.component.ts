import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { Subscription } from 'rxjs';
import { Notification } from '../../../models/notification.model';
import { IUser } from '../../../models/v2/user.schema';
import { ApiService } from '../../../services/api.service';
import { UserService } from '../../../services/api/user.service';
import { NotificationCardComponent } from '../notification-card/notification-card.component';

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
  user: IUser | null = null;
  notifications: Notification[] = [];

  // & |==== Subscriptions ====|
  private userSubscription: Subscription = new Subscription();

  /**
   * ! Constructor
   *
   * @param apiService The API service
   * @param userService The User service
   */
  constructor(
    private apiService: ApiService,
    private userService: UserService
  ) {}

  /**
   * * Runs on Init
   *
   * Subscribes to the current user observable to get user notifications
   */
  ngOnInit(): void {
    this.userSubscription = this.userService.currentUser$.subscribe({
      next: (currentUser: IUser | null) => {
        this.user = currentUser;
        // console.log('NotificationPopup | Current User:', this.user);

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

        // console.log(this.notifications);
      },
      (error: any) => {
        // ? Debug log: Error
        // console.log('ERROR DURING: GET Get All notifications', error);
      }
    );
  }

  removeNotification(notification: Notification) {
    // call the api service to mark the notification as read, and then remove it from notifications[]
    this.apiService.deleteNotificationByIdDELETE(notification._id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(
          (n) => n._id !== notification._id
        );
        // console.log('Notification successfully removed');
      },
      error: (error) => {
        // ? Debug log error
        // console.error('Error while toggling like:', error);
      },
    });
  }
}
