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
  // TODO: 'signed out' means that the sign up page will show, 
  // TODO: 'logged out' means that the login page will show first.
  state: 'logged in' | 'signed up' | 'logged out' | 'signed out' = 'signed out';

  // Event to emit to the navbar to change the title of the dialog
  @Output() titleChangeEvent = new EventEmitter<string>();

  // Event for when the user logs in
  @Output() stateChangeEvent = new EventEmitter<string>();

  // Current input value for the email
  inputEmail: string = '';
  // Invalid state for email input
  inputEmailInvalid: '' | 'ng-invalid ng-dirty' = '';

  // Current input value for the password
  inputPassword: string = '';
  // Curent input value for confirm password
  inputPassword2: string = '';
  // Invalid state for both passwords input
  inputPasswordsInvalid: '' | 'ng-invalid ng-dirty' = ''

  // Profile menu items
  profileMenuItems: MenuItem[] = [];
  // Profile menu state
  profileMenuState: 'details' | 'reviews' = 'details';

  // * Change title on initialisation
  ngOnInit(): void {
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
    if (this.state == 'signed up') { this.titleChangeEvent.emit('Profile'); }
    else if (this.state == 'logged in') { this.titleChangeEvent.emit('Profile'); }
    else if (this.state == 'signed out') { this.titleChangeEvent.emit('Sign Up'); }
    else if (this.state == 'logged out') { this.titleChangeEvent.emit('Login'); }
  }

  // * Confirms the user
  confirm() {
    // Change pseudo state to 'logged in'
    this.state = 'logged in';

    // Change the title of the dialog
    this.titleChangeEvent.emit('Profile');

    // Emit state change to navbar
    this.stateChangeEvent.emit(this.state);
  }

  // * Signs Up the User
  signup() {
    var email = this.inputEmail.replace(/^\s+|\s+$/gm,'');
    // Trim whitespace and check if provided email is a monash email
    if (email.endsWith('@student.monash.edu')) {
      // Check if the passwords match
      if (this.inputPassword == this.inputPassword2) {
        // Change state to logged in 
        this.state = 'signed up';

        // Emit change title of the dialog
        this.titleChangeEvent.emit('Confirmation');

        // Emit state change to navbar
        this.stateChangeEvent.emit(this.state);

        // ? Debug log
        console.log('Signed up | STATE:', this.state);
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

  login() {

  }


  logout() {
    // Change pseudo state to 'logged out'
    this.state = 'logged out';

    // Change the title of the navbar
    this.titleChangeEvent.emit('Sign Up');

    // Emit state change to navbar
    this.stateChangeEvent.emit(this.state);

    // ? Debug log
    console.log('Logged out! STATE:', this.state);
  }
}
