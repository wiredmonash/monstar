import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../shared/services/auth.service';
import { FormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    PasswordModule,
    ToastModule,
  ],
  providers: [
    MessageService
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  // The new password for the user
  password1: string = '';
  password2: string = '';
  // The token
  token: string = '';

  // Submission valid
  valid: boolean = false;

  // State
  state: 'resetting' | 'reset' = 'resetting';
  
  // ! Injects ActivatedRoute, AuthService, Router
  constructor (
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) { }

  /**
   * * On Initialisation
   * 
   * - Gets the token from the route parameters.
   * - TODO: Checks if the token is valid
   * - Resets the state back to 'resetting'
   */
  ngOnInit() {
    this.token = this.route.snapshot.params['token'];
    this.state = 'resetting';
  }

  /**
   * * Reset Password
   * 
   * Resets the password for the user.
   */
  resetPassword() {
    if (this.password1 !== this.password2)
      return this.messageService.add({ severity:'error', summary:'Error', detail:'Passwords do not match' });

    // Reset the password
    this.authService.resetPassword(this.token, this.password1).subscribe({
      next: (response: any) => {
        // Show a toast
        this.messageService.add({ severity:'success', summary:'Success', detail:'Password reset successfully' });

        // Change the state to password has been reset
        this.state = 'reset';

        // Auto login with new password
        this.authService.login(response.data.email, this.password1).subscribe({
          next: (response: any) => {
            // Delay navigation to allow for toast to be displayed
            setTimeout(() => {
              this.goHome();
            }, 2000); // 2 seconds
          },
          error: (error: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to log you in automatically' });
          }
        });
      },
      error: (error: any) => {
        // Show error toast
        this.messageService.add({ severity:'error', summary:'Error', detail:'Failed to reset password' });
      }
    });
  }

  /**
   * * Go Home and Login
   * 
   * - Navigates to the home page
   * - Automatically logs the user in
   */
  goHome() {
    this.router.navigate(['/']);
  }
}
