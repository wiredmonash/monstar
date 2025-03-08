import { Component, Input } from '@angular/core';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ButtonModule } from 'primeng/button';
import { User } from '../../../models/user.model';
import { NotificationCardComponent } from '../notification-card/notification-card.component';
import { CommonModule } from '@angular/common';
import { Notification } from '../../../models/notification.model';
import { BadgeModule } from 'primeng/badge';

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
  user!: User | null;

  @Input()
  profileColor!: string;

  notifications: Notification[] = [
    {
      id: 1,
      username: 'Rasula Yadithya',
      profileImg:
        'https://primefaces.org/cdn/primeng/images/demo/avatar/amyelsner.png',
      unit: 'FIT9131',
    },
    {
      id: 2,
      username: 'Jenul Ferdinand',
      profileImg:
        'https://primefaces.org/cdn/primeng/images/demo/avatar/amyelsner.png',
      unit: 'FIT1049',
    },
    {
      id: 3,
      username: 'Test User',
      profileImg:
        'https://primefaces.org/cdn/primeng/images/demo/avatar/amyelsner.png',
      unit: 'FIT2095',
    },
  ];

  removeNotification(notification: Notification) {
    this.notifications = this.notifications.filter(
      (n) => n.id !== notification.id
    );
  }
}
