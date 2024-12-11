import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// API Service
import { ApiService } from './shared/services/api.service';

// Component imports
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent], 
  providers: [ApiService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'] // Fixed the typo from 'styleUrl' to 'styleUrls'
})
export class AppComponent {
  title = 'frontend';
}
