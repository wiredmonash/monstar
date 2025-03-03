import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  constructor(private router: Router) { }

  /**
   * * Resets the scroll position of the main content container
   */
  resetScroll() {
    // Try various scroll targets - one of these should work
    setTimeout(() => {
      // Option 1: Main app content container
      const appRoot = document.querySelector('app-root');
      if (appRoot) appRoot.scrollTop = 0;
      
      // Option 2: Body and HTML elements
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      
      // Option 3: Common container names
      const containers = [
        '.main-content', 
        '.content-container', 
        '.app-content',
        '.scrollable-content'
      ];
      
      containers.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) el.scrollTop = 0;
      });
    }, 100); // Small delay to ensure DOM is ready
  }

  navigateTo(route: string[]) {
    this.router.navigate(route);
    this.resetScroll();
  }
}
