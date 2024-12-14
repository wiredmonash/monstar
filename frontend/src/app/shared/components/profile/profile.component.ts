import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { Subscription } from 'rxjs';
import { User } from '../../models/user.model';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';

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
    CardModule,
    ProgressSpinnerModule,
    TooltipModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  // All user auth states can be inputted by parent as well
  @Input() state: 'logged in' | 'signed up' | 'logged out' | 'signed out' = 'logged out';

  // Stores the user
  user: User | null = null;

  // Outputs user change to parent
  @Output() userChangeEvent = new EventEmitter<User | null>();

  // Event to emit to the navbar to change the title of the dialog
  @Output() titleChangeEvent = new EventEmitter<string>();

  // Event to emit to the navbar when our state changes
  @Output() stateChangeEvent = new EventEmitter<'logged in' | 'signed up' | 'logged out' | 'signed out'>();

  // Event to emit to the navbar to create a toast
  @Output() createToast = new EventEmitter<{ severity: string, summary: string, detail: string }>();

  // Input to listen for dialogClosedEvent 
  @Input() dialogClosedEvent!: EventEmitter<void>;

  // Stores the subscription to this dialogClosedEvent
  private dialogClosedSubscription!: Subscription;

  // Stores the subscription for currentUser from AuthService
  private userSubscription: Subscription = new Subscription();

  // Current input value for the email
  inputEmail: string = '';
  // Invalid state for email input
  inputEmailInvalid: '' | 'ng-invalid ng-dirty' = '';

  // Current input value for the password
  inputPassword: string = '';
  // Current input value for confirm password
  inputPassword2: string = '';
  // Invalid state for both passwords input
  inputPasswordsInvalid: '' | 'ng-invalid ng-dirty' = '';

  // Signing up and logging in state
  signingUp: boolean = false;
  loggingIn: boolean = false;

  // Profile menu
  profileMenuItems: MenuItem[] = [];
  profileMenuState: 'details' | 'reviews' | 'settings' = 'details';

  // Updating username and password
  inputUpdateUsername: string | undefined = undefined;
  inputUpdatePassword: string = '';

  // Profile loading state
  profileLoading = false;


  // ! Injects AuthService
  constructor (private authService: AuthService) { }


  // * Change title on initialisation
  ngOnInit(): void {
    // Validate session and change state accordingly
    this.authService.validateSession().subscribe({
      next: (response) => {
        console.log('Profile | User is authenticated:', response);
        this.state = 'logged in';
        this.titleChangeEvent.emit('Profile');
        this.stateChangeEvent.emit(this.state);
      },
      error: (error) => {
        console.log('Profile | User is not authenticated:', error);
        this.state = 'logged out';
        this.titleChangeEvent.emit('Login');
        this.stateChangeEvent.emit(this.state);
      }
    });

    // Subscribe to current user
    this.userSubscription = this.authService.getCurrentUser().subscribe({
      next: (currentUser: User | null) => {
        // Store the current user
        this.user = currentUser;

        // Set the current username in the update username field in details page
        this.inputUpdateUsername = this.user?.username;

        // Output to parent the updated current user
        this.userChangeEvent.emit(this.user);

        // ? Debug log change of current user
        console.log('Profile | Current User:', this.user);
      }
    });

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
            label: 'Settings',
            icon: 'pi pi-cog',
            command: () => {
              this.profileMenuState = 'settings';
            }
          },
          {
            separator: true
          },
          {
            label: 'Logout',
            icon: 'pi pi-sign-out',
            command: () => { 
              this.logout(); 
            }
          }
        ]
      }
    ];

    // Subscribe to the dialogClosedEvent
    this.dialogClosedSubscription = this.dialogClosedEvent.subscribe(() => {
      console.log('Profile | Dialog closed event');
      this.inputUpdateUsername = this.user?.username;
    });

    // Changing dialog title based on state
    if (this.state == 'signed up') { this.titleChangeEvent.emit('Verify your email'); }
    else if (this.state == 'logged in') { this.titleChangeEvent.emit('Profile'); }
    else if (this.state == 'signed out') { this.titleChangeEvent.emit('Sign Up'); }
    else if (this.state == 'logged out') { this.titleChangeEvent.emit('Login'); }
  }

  // * Signs Up the User
  signup() {
    this.signingUp = true;
    this.inputEmailInvalid = '';

    // Trim input email whitespace and store as new variable
    var email = this.inputEmail.replace(/^\s+|\s+$/gm,'');

    if (email.endsWith('@student.monash.edu')) {
      if (this.inputPassword == this.inputPassword2) {
        this.authService.register(email, this.inputPassword).subscribe({
          next: (response) => {
            this.state = 'signed up';
            this.titleChangeEvent.emit('Verify your email');
            this.stateChangeEvent.emit(this.state);
            this.signingUp = false;

            // ? Debug log success
            console.log('Profile | Signed up successfuly!', response);
          },
          error: (error: HttpErrorResponse) => {
            this.signingUp = false;

            console.log(error.status); // TODO THIS IS HOW WE GET THE STATUS CODE.

            // ? Debug log error on signed up
            console.error('Profile | Sign up failed:', error.error);
          }
        });
      } else {
        this.inputPasswordsInvalid = 'ng-invalid ng-dirty';
        this.signingUp = false;
        this.inputPassword = '';
        this.inputPassword2 = '';

        // ? Debug log
        console.log('Profile | Passwords do not match.');
      }
    } else {
      this.inputEmailInvalid = 'ng-invalid ng-dirty';
      this.signingUp = false;
      this.inputEmail = '';

      // ? Debug log
      console.log('Profile | Not a monash email', this.inputEmail);
    }
  }

  // * Logs in user
  login() {
    this.loggingIn = true;

    // Trim input email whitespace and store as new variable
    var email = this.inputEmail.replace(/^\s+|\s+$/gm,'');

    // Uses auth service to call the login api
    this.authService.login(email, this.inputPassword).subscribe({
      next: (response) => {
        // Change state to logged in
        this.state = 'logged in';
        this.titleChangeEvent.emit('Profile');
        this.stateChangeEvent.emit(this.state);
        this.loggingIn = false;

        // ? Debug log success
        console.log('Profile | Logged in succesfully!', response);
      },
      error: (error: HttpErrorResponse) => {
        this.inputPasswordsInvalid = 'ng-invalid ng-dirty';
        this.loggingIn = false;

        // TODO: Check the status and type of error and add functionality for those.

        // ? Debug log error on login
        console.error('Profile | Login failed:', error.error);
      }
    });
  }

  // * Logs out user
  logout() {
    this.authService.logout().subscribe({
      next: () => {
        // Change state to logged out
        this.state = 'logged out';
        this.titleChangeEvent.emit('Login');
        this.stateChangeEvent.emit(this.state);

        // Clear local state
        this.inputEmail = '';
        this.inputPassword = '';

        // ? Log success
        console.log('Profile | Logged out successfully!');
      },
      error: (error: HttpErrorResponse) => {
        // ? Debug log error on logout
        console.error('Profile | Logout failed:', error.error);
      }
    });
  }

  // * Updates user details
  updateDetails() {
    if (!this.user || !this.user.username) return

    // Define the empty payload
    const updatePayload: { username?: string, password?: string } = {};

    // Adding username to payload if given and changed
    if (this.inputUpdateUsername && this.inputUpdateUsername !== this.user?.username)
        updatePayload.username = this.inputUpdateUsername;

    // Adding password to payload if given
    if (this.inputUpdatePassword)
      updatePayload.password = this.inputUpdatePassword;

    // If the payload is empty we don't update
    if (Object.keys(updatePayload).length === 0) {
      console.log('Profile | No fields to update');
      return;
    }

    // Updates the user's username and/or password using AuthService
    if (this.user.email)
      this.authService.updateDetails(this.user.email, updatePayload.username, updatePayload.password).subscribe({
        next: (response) => {
          // Set the updated username for our user
          if (updatePayload.username && this.user) {
            this.user.username = updatePayload.username;
          }

          // Reset the fields
          this.inputUpdateUsername = this.user?.username || '';
          this.inputUpdatePassword = '';

          // Show success toast
          this.createToast.emit({ severity: 'success', summary: 'Updated details!', detail: 'You have updated your details' });

          // ? Debug log show success
          console.log('Profile | Details updated successfully', response);
        },
        error: (error) => {
          // Show error toast
          this.createToast.emit({ severity: 'error', summary: 'Error Updating Details', detail: 'Some error occurred whilst updating details' });

          // ? Debug log show error message
          console.error('Profile | Error updating details', error);
        }
    });
  }

  // * User can upload their avatar
  uploadAvatar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async () => {
      this.profileLoading = true;
      const file = (input.files as FileList)[0];
      if (file && this.user?.email) {
        this.authService.uploadAvatar(file, this.user.email).subscribe({
          next: (response) => {
            // Update the user's profile image
            if (this.user) {
              this.user.profileImg = response.profileImg;
            }

            this.profileLoading = false;

            // Emit a success toast
            this.createToast.emit({ severity: 'success', summary: 'Avatar Updated!', detail: 'Your profile picture has been updated successfully.' });
          },
          error: (error) => {
            // Emit an error toast
            this.createToast.emit({ severity: 'error', summary: 'Upload failed', detail: error.message || 'Failed to upload avatar' });
          }
        });
      }
    };

    input.click();
  }

  // * Runs on removal of this component
  ngOnDestroy(): void {
    // Clean up subscriptions to avoid memory leaks
    if (this.userSubscription) { this.userSubscription.unsubscribe(); }
    if (this.dialogClosedSubscription) { this.dialogClosedSubscription.unsubscribe(); }
  }
}
