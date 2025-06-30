import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FooterService {
  private showFooterSubject = new BehaviorSubject<boolean>(true);
  public showFooter$: Observable<boolean> = this.showFooterSubject.asObservable();

  constructor() { }

  hideFooter(): void {
    this.showFooterSubject.next(false);
  }

  showFooter(): void {
    this.showFooterSubject.next(true);
  }
}
