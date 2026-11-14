import { Component, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';
import { MessageService, PrimeNGConfig } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FooterComponent } from '@components/footer/footer.component';
import { NavbarComponent } from '@components/navbar/navbar.component';
import { filter } from 'rxjs';

// Vercel Analytics
import { inject as injectAnalytics } from '@vercel/analytics';
import type { BeforeSendEvent } from '@vercel/analytics';

// Profile URLs carry usernames, which default to a student's authcate, so
// replace them before the page view leaves the browser.
export const maskProfileUrl = (event: BeforeSendEvent): BeforeSendEvent => ({
  ...event,
  url: event.url.replace(/\/user\/[^/?#]+/g, '/user/[username]'),
});

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastModule],
  providers: [MessageService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'], // Fixed the typo from 'styleUrl' to 'styleUrls'
})
export class AppComponent implements OnInit {
  title = 'frontend';
  showFooter: boolean = true;

  constructor(
    private primengConfig: PrimeNGConfig,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Inject Vercel Analytics
    injectAnalytics({ beforeSend: maskProfileUrl });
  }

  ngOnInit(): void {
    // Routes opt out of the footer with `data: { hideFooter: true }`
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.showFooter = !this.route.firstChild?.snapshot.data['hideFooter'];
      });

    // Enable PrimeNG ripple effect globally
    this.primengConfig.ripple = true;
  }
}
