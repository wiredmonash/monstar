import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// API Service
import { ApiService } from '../api.service';

// Component imports
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { HomeComponent } from './routes/home/home.component';
import { UnitReviewHeaderComponent } from './shared/components/unit-review-header/unit-review-header.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, HomeComponent, UnitReviewHeaderComponent], 
  providers: [ApiService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'] // Fixed the typo from 'styleUrl' to 'styleUrls'
})
export class AppComponent {
  title = 'frontend';
}
