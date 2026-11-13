import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

import { Notification } from 'app/shared/models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private url = environment.apiV2Url;

  private http = inject(HttpClient);

  getByUser(userId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(
      `${this.url}/notifications/user/${userId}`,
      { withCredentials: true }
    );
  }

  deleteById(notificationId: string) {
    return this.http.delete(`${this.url}/notifications/${notificationId}`, {
      withCredentials: true,
    });
  }
}
