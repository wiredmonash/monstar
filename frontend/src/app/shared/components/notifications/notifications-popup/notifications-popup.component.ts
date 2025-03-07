import { Component, Input } from '@angular/core';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ButtonModule } from 'primeng/button';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-notifications-popup',
  standalone: true,
  imports: [OverlayPanelModule, ButtonModule],
  templateUrl: './notifications-popup.component.html',
  styleUrl: './notifications-popup.component.scss',
})
export class NotificationsPopupComponent {
  @Input()
  user!: User | null;

  @Input()
  profileColor!: string;
}
