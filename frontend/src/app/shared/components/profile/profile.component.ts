import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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

declare var google: any;

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
export class ProfileComponent implements OnInit, OnDestroy, AfterViewInit {
  // used to get the google sign in button element
  @ViewChild('googleSignInButton') googleSignInButton!: ElementRef;

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

  // Current input value for the password
  inputPassword: string = '';
  // Current input value for confirm password
  inputPassword2: string = '';

  // Email input of duplicate nature status
  isUserSignUpDuplicate: boolean = false;
  // Email input is verified status
  isEmailInputVerified: boolean = true;
  // Email input validity status
  isEmailInputValid: boolean = true;
  // Password input validity status
  isPasswordsInputValid: boolean = true;
  // Email verification sent capped status
  isVerifyEmailSentCapped: boolean = false;
  // User input validity status
  isUsernameInputValid: boolean = true;

  // Signing up and logging in state
  signingUp: boolean = false;
  loggingIn: boolean = false;

  // Profile menu
  profileMenuItems: MenuItem[] = [];
  profileMenuState: 'details' | 'reviews' | 'friends' | 'settings' = 'details';

  // Updating username and password
  inputUpdateUsername: string | undefined = undefined;
  inputUpdatePassword: string = '';

  // Profile loading state
  profileLoading = false;


  // ! Injects AuthService
  constructor (
    private authService: AuthService) { }


  // * Change title on initialisation
  ngOnInit(): void {
    // Validate session and change state accordingly
    this.authService.validateSession().subscribe({
      next: (response) => {
        console.log('Profile | User is authenticated:', response);
        this.state = 'logged in';
        this.createToast.emit({ severity: 'success', summary: 'Validated Session & Logged in', detail: 'You are logged in!' });
        this.titleChangeEvent.emit('Profile');
        this.stateChangeEvent.emit(this.state);
      },
      error: (error) => {
        console.log('Profile | User is not authenticated:', error);
        this.state = 'logged out';
        this.createToast.emit({ severity: 'warn', summary: 'Session Expired & Logged out', detail: 'You are logged out!' });
        this.titleChangeEvent.emit('Login');
        this.stateChangeEvent.emit(this.state);
      }
    });

    // Subscribe to current user
    this.userSubscription = this.authService.getCurrentUser().subscribe({
      next: (currentUser: User | null) => {
        // Store the current user
        this.user = currentUser;

        if (this.user?.verified) {
          this.state = 'logged in';
          this.createToast.emit({ severity: 'success', summary: 'Logged in', detail: 'You are logged in!' });
          this.titleChangeEvent.emit('Profile');
          this.stateChangeEvent.emit(this.state); 
        }

        // Set the current username in the update username field in details page
        this.inputUpdateUsername = this.user?.username;

        // Update the profile menu label with the new username
        const userItem = this.profileMenuItems.find(item => item.label?.startsWith('User:'));
        if (userItem) {
          userItem.label = `User: ${this.user?.username || 'Guest'}`;
        }

        // Output to parent the updated current user
        this.userChangeEvent.emit(this.user);

        // ? Debug log change of current user
        console.log('Profile | Current User:', this.user);
      }
    });

    // Set profile menu items
    this.profileMenuItems = [
      {
        label: `User: ${this.user?.username || 'Guest'}`,
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
            icon: 'pi pi-address-book',
            command: () => {
              this.profileMenuState = 'reviews';
            }
          },
          {
            label: 'Friends',
            icon: 'pi pi-users',
            command: () => {
              this.profileMenuState = 'friends';
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
      this.inputEmail = '';
      this.inputPassword = '';
      this.inputPassword2 = '';
    });

    // Changing dialog title based on state
    if (this.state == 'signed up') { this.titleChangeEvent.emit('Verify your email'); }
    else if (this.state == 'logged in') { this.titleChangeEvent.emit('Profile'); }
    else if (this.state == 'signed out') { this.titleChangeEvent.emit('Sign Up'); }
    else if (this.state == 'logged out') { this.titleChangeEvent.emit('Login'); }

  }

  ngAfterViewInit(): void {
    google.accounts.id.initialize({
      client_id: '923998517143-95jlbb9v6vi97km61nfod8c3pg754q49.apps.googleusercontent.com',
      // * login_uri is only supported on ux_mode: "redirect", callback is used otherwise
      callback: this.onGoogleSignIn.bind(this),
      // login_uri: "http://localhost:8080/api/v1/auth/google/register",
      ux_mode: "popup",
    })


    // https://developers.google.com/identity/gsi/web/guides/display-button#javascript
    google.accounts.id.renderButton(
      // get googleSignInButton on the document
      // using document.getElementById() doesn't work for some reason
      this.googleSignInButton.nativeElement,
      {
        // Options go here, for example:
        type: "standard",
        shape: "pill",
        theme: "outline",
        text: "signup_with",
        size: "large",
        logo_alignment: "left",
        width: "275"
      }
    );
    // uncommenting this enables the one-click sign in prompt in the corner
    // google.accounts.id.prompt();
  };

  onGoogleSignIn(res: any): void {
    const credential = res.credential;
    this.googleAuthenticate(credential);
  }

  googleAuthenticate(credential: string) {
    this.authService.googleAuthenticate(credential).subscribe({
      next: (response) => {
        // Change state to logged in
        this.state = 'logged in';
        this.titleChangeEvent.emit('Profile');
        this.stateChangeEvent.emit(this.state);
        this.loggingIn = false;

        // this.createToast.emit({ severity: 'success', summary: 'Logged in', detail: 'You are logged in!' });

        // ? Debug log success
        console.log('Profile | Logged in succesfully!', response);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status == 409) {
          this.createToast.emit({ severity: 'warn', summary: 'Account exists', detail: "Account exists as non-Google user, please sign in manually." });
        }
        else if (error.status == 403) {
          this.createToast.emit({ severity: 'warn', summary: 'Invalid email', detail: "Please sign in using a Monash Student email." });
        }

        // ? Debug log error on signed up
        console.error('Profile | Google Authenticate failed:', error.error);
      }
    });
  }

  // * Signs Up the User
  signup() {
    this.signingUp = true;
    this.isEmailInputValid = true;
    this.isPasswordsInputValid = true;
    this.isUserSignUpDuplicate = false;

    // Trim input email whitespace and store as new variable
    var email = this.inputEmail.trim();

    // Regular expression to validate authcate and email
    const emailRegex = /^[a-zA-Z]{4}\d{4}@student\.monash\.edu$/

    // Check if the email matches the regular expression
    if (emailRegex.test(email)) {
      // Check if the passwords match
      if (this.inputPassword == this.inputPassword2) {
        // Subscribe to the register AuthService, passing in email and password
        this.authService.register(email, this.inputPassword).subscribe({
          next: (response) => {
            this.state = 'signed up';
            this.titleChangeEvent.emit('Verify your email');
            this.stateChangeEvent.emit(this.state);
            this.signingUp = false;

            // Clear the input fields
            this.inputEmail = '';
            this.inputPassword = '';
            this.inputPassword2 = '';

            this.createToast.emit({ severity: 'info', summary: 'Signed Up', detail: 'You have signed up, now you must confirm your email!' });

            // ? Debug log success
            console.log('Profile | Signed up successfuly!', response);
          },
          error: (error: HttpErrorResponse) => {
            this.signingUp = false;

            // If the error status is 400, the user already exists
            if (error.status == 400) {
              this.isUserSignUpDuplicate = true;
              this.createToast.emit({ severity: 'warn', summary: 'User already exists', detail: 'User already exists, please login.' });
            }

            // ? Debug log error on signed up
            console.error('Profile | Sign up failed:', error.error);
          }
        });
      }
      // If the passwords don't match
      else {
        this.isPasswordsInputValid = false;
        this.signingUp = false;

        // Clear passwords
        this.inputPassword = '';
        this.inputPassword2 = '';

        this.createToast.emit({ severity: 'error', summary: 'Passwords do not match', detail: 'Please make sure your passwords match.' });

        // ? Debug log
        console.log('Profile | Passwords do not match.');
      }
    }
    // If the email is invalid
    else {
      this.isEmailInputValid = false;
      this.signingUp = false;

      // Clear form
      this.inputEmail = '';
      this.inputPassword = '';
      this.inputPassword2 = '';

      this.createToast.emit({ severity: 'error', summary: 'Invalid email', detail: 'Please enter a valid Monash email.' });

      // ? Debug log
      console.log('Profile | Not a monash email');
    }
  }

  // * Logs in user
  login() {
    this.loggingIn = true;
    this.isEmailInputValid = true;
    this.isEmailInputVerified = true;
    this.isPasswordsInputValid = true;

    // Trim input email whitespace and store as new variable
    var email = this.inputEmail.trim();

    // Regular expression to validate authcate and email
    const emailRegex = /^[a-zA-Z]{4}\d{4}@student\.monash\.edu$/

    // Check if emails ends with monash email
    if (emailRegex.test(email)) {
      // Uses auth service to call the login api
      this.authService.login(email, this.inputPassword).subscribe({
        next: (response) => {
          // Change state to logged in
          this.state = 'logged in';
          this.titleChangeEvent.emit('Profile');
          this.stateChangeEvent.emit(this.state);
          this.loggingIn = false;

          // Clear the input fields
          this.inputEmail = '';
          this.inputPassword = '';

          this.createToast.emit({ severity: 'success', summary: 'Logged in', detail: 'You are logged in!' });

          // ? Debug log success
          console.log('Profile | Logged in succesfully!', response);
        },
        error: (error: HttpErrorResponse) => {
          // Wrong password or email
          this.isPasswordsInputValid = false;
          this.loggingIn = false;

          // Clear the password
          this.inputPassword = '';

          if (error.status == 409) {
            this.createToast.emit({ severity: 'warn', summary: 'Account exists', detail: "Account already exists as Google user." });
          }

          // Check for 429 Too Many Requests status code when user is rate limited
          if (error.status == 429) {
            this.isVerifyEmailSentCapped = true;
            this.createToast.emit({ severity: 'warn', summary: '429 Too Many Requests', detail: "We have sent you too many emails at this time." });
          }

          // Check for 403 Forbidden status code when user is not verified yet
          if (error.status == 403) {
            this.isEmailInputValid = true;
            this.isPasswordsInputValid = true;
            this.isEmailInputVerified = false;
            this.createToast.emit({ severity: 'warn', summary: 'Email not verified', detail: 'Please verify your email before logging in' });
          }

          // ? Debug log error on login
          console.error('Profile | Login failed:', error.error);
        }
      });
    }
    // If the email is invalid
    else {
      this.isEmailInputValid = false;
      this.loggingIn = false;
      this.inputEmail = '';

      // Clear the password
      this.inputPassword = '';
      
      this.createToast.emit({ severity: 'error', summary: 'Invalid email', detail: 'Please enter a valid Monash email.' });

      // ? Debug log
      console.log('Profile | Not a valid monash email', this.inputEmail);
    }
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

        this.createToast.emit({ severity: 'warn', summary: 'Logged out', detail: 'You are logged out!' });

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

    const usernameRegex = /^[a-zA-Z0-9]{1,20}$/;

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
    if (usernameRegex.test(updatePayload.username || this.user.username)) {
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
            
            // Update the profile menu label with the new username
            const userItem = this.profileMenuItems.find(item => item.label?.startsWith('User:'));
            if (userItem) {
              userItem.label = `User: ${this.user?.username || 'Guest'}`;
            }

            // Show success toast
            this.createToast.emit({ severity: 'success', summary: 'Updated details!', detail: 'You have updated your details' });

            // ? Debug log show success
            console.log('Profile | Details updated successfully', response);
          },
          error: (error) => {
            // Show error toast
            this.createToast.emit({
              severity: 'error',
              summary: 'Error Updating Details',
              detail: 'Some error occurred whilst updating details'
            });

            // ? Debug log show error message
            console.error('Profile | Error updating details', error);
          }
        });
    }
    else {
      this.isUsernameInputValid = false;
      this.inputUpdateUsername = '';
      this.inputUpdatePassword = '';
      this.createToast.emit({ severity: 'error', summary: 'Invalid username', detail: 'Please enter a valid username' });
      console.log('Profile | Not a valid username')
    }
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
