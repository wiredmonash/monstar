import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import confetti from 'canvas-confetti';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../shared/services/auth.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-verified',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    RouterLink,
    ToastModule
  ], 
  providers: [
    MessageService
  ],
  templateUrl: './verified.component.html',
  styleUrls: ['./verified.component.scss'],
})
export class VerifiedComponent implements OnInit {
  // Stores verification status
  verificationMessage: string = '';
  verificationSuccess: boolean = false;

  // ! Inject ActivatedRoute, AuthService & MessageService
  constructor (
    private activatedRoute: ActivatedRoute, 
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  /**
   * * Runs on initialisation
   * 
   * Gets the token from the route parameter, then verifies the user using the
   * token.
   */
  ngOnInit(): void {
    // Get the token from the :token route parameter
    const token = this.activatedRoute.snapshot.paramMap.get('token');

    // Verify the token if it exists
    if (token) this.verifyEmail(token);
  }

  /**
   * * Calls backend to verify the email
   * 
   * @param {string} token The token to verify the user with
   */
  verifyEmail(token: string): void {
    this.authService.verifyAndLogin(token).subscribe(
      (response) => {
        this.verificationSuccess = true;
        this.verificationMessage = 'Email successfully verified!';
        this.messageService.add({ severity: 'success', summary: 'Email verified!', detail: 'You have verified your email!' });
        this.launchConfettiContinuously();

        // ? Debug log user
        // console.log('verified.component.ts: verify and login successful!');
      },
      (error) => {
        this.verificationSuccess = false;
        this.verificationMessage = error.error?.message || 'An error occured during verification.';
        this.messageService.add({ severity: 'error', summary: 'Email verification failed.', detail: 'Email verification failed, try again.' });

        // ? Debug log error 
        // console.log('verified.component.ts: verify and login failed');
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