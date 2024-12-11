import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
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
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  // All user auth states
  // ? 'signed out' means that the sign up page will show, 
  // ? 'logged out' means that the login page will show first.
  state: 'logged in' | 'signed up' | 'logged out' | 'signed out' = 'signed out';

  // Event to emit to the navbar to change the title of the dialog
  @Output() titleChangeEvent = new EventEmitter<string>();

  // Event to emit to the navbar when our state changes
  @Output() stateChangeEvent = new EventEmitter<string>();

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
        },
        (error) => {
          console.log('User is not authenticated:', error);
          this.state = 'logged out';
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

  // * Signs Up the User
  signup() {
    // Trim input email whitespace and store as new variable
    var email = this.inputEmail.replace(/^\s+|\s+$/gm,'');

    // Check if provided email is a monash email
    if (email.endsWith('@student.monash.edu')) {
      // Check if the passwords match
      if (this.inputPassword == this.inputPassword2) {
        // Register using auth service
        this.authService.register(email, this.inputPassword).subscribe(
          (response) => {
            // Change state to signed up
            this.state = 'signed up';
            this.titleChangeEvent.emit('Verify your email');
            this.stateChangeEvent.emit(this.state);

            // ? Debug log success
            console.log('Signed up successfuly!', response);
          },
          (error: HttpErrorResponse) => {
            // ? Debug log error on signed up
            console.error('Sign up failed:', error.error);
          }
        );
      } else {
        // ? Debug log
        console.log('Passwords do not match.');

        // Make the password inputs have invalid class
        this.inputPasswordsInvalid = 'ng-invalid ng-dirty';
      }
    } else {
      // ? Debug log
      console.log('Not a monash email', this.inputEmail);

      // Make the email input have invalid class
      this.inputEmailInvalid = 'ng-invalid ng-dirty';
    }


  }

  // * Logs in user
  login() {
    // Trim input email whitespace and store as new variable
    var email = this.inputEmail.replace(/^\s+|\s+$/gm,'');

    this.authService.login(email, this.inputPassword).subscribe(
      (response) => {
        // Change state to logged in
        this.state = 'logged in';
        this.titleChangeEvent.emit('Profile');
        this.stateChangeEvent.emit(this.state);

        // ? Debug log success
        console.log('Logged in succesfully!', response);
      },
      (error: HttpErrorResponse) => {
        // ? Debug log error on login
        console.error('Login failed:', error.error);

        // Make the password fields have invalid class
        this.inputPasswordsInvalid = 'ng-invalid ng-dirty';
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
