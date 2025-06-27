import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Services
import { ApiService } from './shared/services/api.service';
import { FooterService } from './shared/services/footer.service';

// Components
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { PrimeNGConfig } from 'primeng/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent], 
  providers: [ApiService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'] // Fixed the typo from 'styleUrl' to 'styleUrls'
})
export class AppComponent implements OnInit {
  title = 'frontend';
  showFooter: boolean = true;

  constructor (
    private primengConfig: PrimeNGConfig,
    private footerService: FooterService
  ) {}

  ngOnInit(): void {
    // Enable PrimeNG ripple effect globally
    this.primengConfig.ripple = true;

    // Subscribe to footer visibility changes
    this.footerService.showFooter$.subscribe(show => {
      this.showFooter = show;
    })
  }
}
