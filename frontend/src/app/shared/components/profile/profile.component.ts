import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MenuModule } from 'primeng/menu';
import { Avatar, AvatarModule } from 'primeng/avatar';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    InputTextModule,
    PasswordModule,
    ButtonModule,
    FloatLabelModule,
    DividerModule,
    FormsModule,
    MenuModule,
    InputTextModule,
    AvatarModule,
    CardModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  // All user auth states can be inputted by parent as well
  @Input() state: 'logged in' | 'signed up' | 'logged out' | 'signed out' = 'signed out';

  // Event to emit to the navbar to change the title of the dialog
  @Output() titleChangeEvent = new EventEmitter<string>();

  // Event to emit to the navbar when our state changes
  @Output() stateChangeEvent = new EventEmitter<'logged in' | 'signed up' | 'logged out' | 'signed out'>();

  // Current input value for the email
  inputEmail: string = '';
  // Invalid state for email input
  inputEmailInvalid: '' | 'ng-invalid ng-dirty' = '';

  // Current input value for the password
  inputPassword: string = '';
  // Current input value for confirm password
  inputPassword2: string = '';
  // Invalid state for both passwords input
  inputPasswordsInvalid: '' | 'ng-invalid ng-dirty' = ''

  // Signing up state
  signingUp: boolean = false;
  // Logging in state
  loggingIn: boolean = false;

  // Profile menu items
  profileMenuItems: MenuItem[] = [];
  // Profile menu state
  profileMenuState: 'details' | 'reviews' = 'details';

  constructor (private authService: AuthService) { }

  // * Change title on initialisation
  ngOnInit(): void {
    // Validate session and change state accordingly
    setTimeout(() => {
      this.authService.validateSession().subscribe(
        (response) => {
          console.log('User is authenticated:', response);
          this.state = 'logged in';
          this.titleChangeEvent.emit('Profile');
          this.stateChangeEvent.emit(this.state);
        },
        (error) => {
          console.log('User is not authenticated:', error);
          this.state = 'logged out';
          this.titleChangeEvent.emit('Login');
          this.stateChangeEvent.emit(this.state);
        }
      );
    }, 500); // Wait for 500ms to let the cookie propagate.

    // Set profile menu items
    this.profileMenuItems = [
      {
        label: 'User: jfer0043',
        items: [
          {
            label: 'Details',
            icon: 'pi pi-user',
            command: () => {
              this.profileMenuState = 'details';
            }
          },
          {
            label: 'Reviews',
            icon: 'pi pi-upload',
            command: () => {
              this.profileMenuState = 'reviews';
            }
          },
          {
            separator: true
          },
          {
            label: 'Logout',
            icon: 'pi pi-sign-out',
            command: () => { this.logout(); }
          }
        ]
      }
    ];

    // Changing dialog title based on state
    if (this.state == 'signed up') { this.titleChangeEvent.emit('Verify your email'); }
    else if (this.state == 'logged in') { this.titleChangeEvent.emit('Profile'); }
    else if (this.state == 'signed out') { this.titleChangeEvent.emit('Sign Up'); }
    else if (this.state == 'logged out') { this.titleChangeEvent.emit('Login'); }
  }

  // TODO: Get current user


  // * Signs Up the User
  signup() {
    // Signing up
    this.signingUp = true;

    // Trim input email whitespace and store as new variable
    var email = this.inputEmail.replace(/^\s+|\s+$/gm,'');

    if (email.endsWith('@student.monash.edu')) {
      if (this.inputPassword == this.inputPassword2) {
        this.authService.register(email, this.inputPassword).subscribe(
          (response) => {
            this.state = 'signed up';
            this.titleChangeEvent.emit('Verify your email');
            this.stateChangeEvent.emit(this.state);
            this.signingUp = false;

            // ? Debug log success
            console.log('Signed up successfuly!', response);
          },
          (error: HttpErrorResponse) => {
            this.signingUp = false;

            // ? Debug log error on signed up
            console.error('Sign up failed:', error.error);
          }
        );
      } else {
        this.inputPasswordsInvalid = 'ng-invalid ng-dirty';
        this.signingUp = false;

        // ? Debug log
        console.log('Passwords do not match.');
      }
    } else {
      this.inputEmailInvalid = 'ng-invalid ng-dirty';
      this.signingUp = false;

      // ? Debug log
      console.log('Not a monash email', this.inputEmail);
    }
  }

  // * Logs in user
  login() {
    this.loggingIn = true;

    // Trim input email whitespace and store as new variable
    var email = this.inputEmail.replace(/^\s+|\s+$/gm,'');

    this.authService.login(email, this.inputPassword).subscribe(
      (response) => {
        // Change state to logged in
        this.state = 'logged in';
        this.titleChangeEvent.emit('Profile');
        this.stateChangeEvent.emit(this.state);
        this.loggingIn = false;

        // ? Debug log success
        console.log('Logged in succesfully!', response);
      },
      (error: HttpErrorResponse) => {
        this.inputPasswordsInvalid = 'ng-invalid ng-dirty';
        this.loggingIn = false;

        // ? Debug log error on login
        console.error('Login failed:', error.error);
      }
    );
  }

  // * Logs out user
  logout() {
    this.authService.logout().subscribe(
      () => {
        // Change state to logged out
        this.state = 'logged out';
        this.titleChangeEvent.emit('Login');
        this.stateChangeEvent.emit(this.state);

        // Clear local state
        this.inputEmail = '';
        this.inputPassword = '';

        // ? Log success
        console.log('Logged out successfully!');
      },
      (error: HttpErrorResponse) => {
        // ? Debug log error on logout
        console.error('Logout failed:', error.error);
      }
    );
  }
}
