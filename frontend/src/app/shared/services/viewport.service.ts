import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ViewportType = 'desktop' | 'laptop' | 'tablet' | 'mobile';

@Injectable({
  providedIn: 'root'
})
export class ViewportService {
  // Breakpoints for different viewport types
  private desktopLimit = 1024;
  private tabletLimit = 768;
  private mobileLimit = 400;

  // BehaviorSubject to store the current viewport type
  private viewportSubject = new BehaviorSubject<ViewportType>(this.getCurrentViewportType());
  // Expose as observable if needed
  viewport$ = this.viewportSubject.asObservable();

  /**
   * ! Constructor
   * 
   * Detects the current viewport and listens for window resize events
   */
  constructor() { 
    // Detect the current viewport
    this.detectViewport();

    // Listen for window resize events
    window.addEventListener('resize', this.detectViewport.bind(this));
  }

  /**
   * * Checks the current window width and updates the viewport subject.
   */
  private detectViewport() {
    const viewportType = this.getCurrentViewportType();
    this.viewportSubject.next(viewportType);
  }

  /**
   * * Determines the viewport type based on window width
   */
  private getCurrentViewportType(): ViewportType {
    const width = window.innerWidth;
    if (width <= this.mobileLimit) {
      // console.log('ViewportService | getCurrentViewportType: mobile');
      return 'mobile';
    } else if (width <= this.tabletLimit) {
      // console.log('ViewportService | getCurrentViewportType: tablet');
      return 'tablet';
    } else if (width <= this.desktopLimit) {
      // console.log('ViewportService | getCurrentViewportType: laptop');
      return 'laptop';
    } else {
      // console.log('ViewportService | getCurrentViewportType: desktop');
      return 'desktop';
    }
  }

  /**
   * * Returns teh current viewport type
   */
  getViewportType(): ViewportType {
    return this.viewportSubject.value;
  }
}
