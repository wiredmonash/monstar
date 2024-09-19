import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// API Service
import { ApiService } from '../api.service';

// Component imports
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { FaqComponent } from './faq/faq.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, FaqComponent],
  providers: [ApiService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'frontend';
  // Stores the message from the backend
  message = '';

  constructor (private apiService: ApiService) {}

  // Back End Connection Test
  ngOnInit() {
    this.apiService.getMessage().subscribe(
      (data: any) => { this.message = data.msg },
      (error: any) => { console.error('An error occurred', error) }
    );
  }
}
