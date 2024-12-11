import { Component, AfterViewInit, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import confetti from 'canvas-confetti';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-verified',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    RouterLink,
  ], 
  templateUrl: './verified.component.html',
  styleUrls: ['./verified.component.scss'],
})
export class VerifiedComponent implements OnInit {
  // Stores verification status
  verificationMessage: string = '';
  verificationSuccess: boolean = false;

  // Inject ActivatedRoute & AuthService
  constructor (
    private activatedRoute: ActivatedRoute, 
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get the token from the :token route parameter
    const token = this.activatedRoute.snapshot.paramMap.get('token');

    // Verify the token if it exists
    if (token)
      this.verifyEmail(token);
  }

  /**
   * Call backend to verify the email
   */
  verifyEmail(token: string): void {
    this.authService.verifyAndLogin(token).subscribe(
      (response) => {
        this.verificationSuccess = true;
        this.verificationMessage = 'Email successfully verified!'
        this.launchConfettiContinuously();

        // ? Debug log user
        console.log('User logged in');
      },
      (error) => {
        this.verificationSuccess = false;
        this.verificationMessage = error.error?.message || 'An error occured during verification.'
      }
    );
  }

  /**
   * * Launches some confetti for 3 seconds
   */
  launchConfettiContinuously(): void {
    const duration = 3 * 1000; // 3 seconds
    const end = Date.now() + duration;

    const frame = () => {
      // Launch confetti from the left edge
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });

      // Launch confetti from the right edge
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      // Continue launching confetti if we're still within the duration
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    // Start the animation
    frame();
  }
}