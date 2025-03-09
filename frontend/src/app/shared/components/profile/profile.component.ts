import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { ApiService } from '../../services/api.service';
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
import { TableModule } from 'primeng/table';
import { CommonModule, DatePipe, UpperCasePipe } from '@angular/common';
import { RatingModule } from 'primeng/rating';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { MenubarModule } from 'primeng/menubar';
import { ViewportService, ViewportType } from '../../services/viewport.service';
import { Review } from '../../models/review.model';
import { WriteReviewUnitComponent } from "../write-review-unit/write-review-unit.component";
import { Unit } from '../../models/unit.model';
declare var google: any;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ConfirmPopupModule,
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
    TooltipModule,
    TableModule,
    UpperCasePipe,
    RatingModule,
    DatePipe,
    SkeletonModule,
    MenubarModule,
    CommonModule,
    WriteReviewUnitComponent
  ],
  providers: [
    ConfirmationService
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit, OnDestroy {
  // Making window available for use in the template
  window = window;
  
  // ViewChild to reference the WriteReviewUnitComponent
  @ViewChild(WriteReviewUnitComponent) writeReviewDialog!: WriteReviewUnitComponent;

  // & |==== View Children ====|
  @ViewChild('googleSignInButton') googleSignInButton!: ElementRef;
  @ViewChild('usernameInput') usernameInput!: ElementRef;

  // & |==== Component Events (Outputs) ====|
  @Output() userChangeEvent = new EventEmitter<User | null>();
  @Output() titleChangeEvent = new EventEmitter<string>();
  @Output() stateChangeEvent = new EventEmitter<'logged in' | 'signed up' | 'logged out' | 'signed out' | 'forgot password'>();
  @Output() createToast = new EventEmitter<{ severity: string, summary: string, detail: string }>();

  // & |==== Dialog Events (Inputs) ====|
  @Input() dialogClosedEvent!: EventEmitter<void>;
  @Input() dialogOpenedEvent!: EventEmitter<void>;

  // Emits that the user has edited a review
  @Output() reviewEdited = new EventEmitter<void>();

  // & |==== Subscriptions ====|
  private dialogClosedSubscription!: Subscription;
  private dialogOpenedSubscription!: Subscription;
  private userSubscription: Subscription = new Subscription();
  viewportType: ViewportType = 'desktop';

  // & |==== User Data ====|
  user: User | null = null;
  reviews: any[] = [];

  // & |==== Review Details ====|
  unit: Unit | null = null;
  review: Review = new Review();

  // & |==== Forms Inputs ====|
  // Login/Signup
  inputEmail: string = '';
  inputPassword: string = '';
  inputPassword2: string = '';

  // Password Reset
  inputForgotPasswordEmail: string = '';
  inputUpdatePassword: string = '';

  // Profile Update
  inputUpdateUsername: string | undefined = undefined;

  // & |==== State Flags ====|
  // Authentication States
  signingUp: boolean = false;
  loggingIn: boolean = false;
  profileLoading = false;

  // Username Update State
  isEditingUsername = false;

  // Input Validation States
  isUserSignUpDuplicate: boolean = false;
  isEmailInputVerified: boolean = true;
  isEmailInputValid: boolean = true;
  isPasswordsInputValid: boolean = true;
  isVerifyEmailSentCapped: boolean = false;
  isUsernameInputValid: boolean = true;

  // Reset Email States
  isResetEmailSentCapped: boolean = false;
  resetEmailButtonDisabled: boolean = false;
  resetEmailTimer: any;

  // & |==== Profile Menu ====|
  profileMenuItems: MenuItem[] = [];
  profileMenuState: 'details' | 'reviews' | 'friends' | 'settings' = 'details';
  menuStates = ['details', 'reviews', 'settings'];

  // & |==== Google Sign In States ====|
  showGoogleSkeleton: boolean = false;
  isGoogleLoading: boolean = false;
  googleLoadError: boolean = false;

  // & |==== Component State ====|
  private _state: 'logged in' | 'signed up' | 'logged out' | 'signed out' | 'forgot password' = 'logged out';
  
  // & |==== State Getters & Setters ====|
  @Input()
  get state(): 'logged in' | 'signed up' | 'logged out' | 'signed out' | 'forgot password' { return this._state; }
  set state(value: 'logged in' | 'signed up' | 'logged out' | 'signed out' | 'forgot password') {
    // Set the state
    this._state = value;

    // If the state is signed out or logged out, we show the Google Sign In button
    if (value === 'signed out' || value === 'logged out') {
      // Show the skeleton initally
      this.showGoogleSkeleton = true;
      
      // Load the Google Sign In button asynchronously
      setTimeout(async () => {
        // Try to render the Google Sign In button asynchronously
        try { await this.renderGoogleButton(); } 
        // Log the error and set the error state
        catch (error) { console.error('Profile | Google Sign In failed to load:', error); await this.renderGoogleButton(); }
        // Hide the skeleton
        finally { setTimeout(() => { this.showGoogleSkeleton = false; }, 1000); }
      });
    }
  }


  /**
   * ! Constructor
   * 
   * @param apiService The API service
   * @param authService The Auth service
   * @param confirmService The Confirmation service
   * @param viewportService The Viewport service
   */
  constructor (
    private apiService: ApiService,
    private authService: AuthService,
    private confirmService: ConfirmationService,
    private viewportService: ViewportService
  ) { }



  /** 
   *  ! |======================================================================|
   *  ! | ANGULAR LIFECYCLE HOOKS                                              |
   *  ! |======================================================================|
   */

  /**
   * * Runs on initialisation of this component
   * 
   * - Validates the session and changes the state accordingly
   * - Subscribes to the current user
   * - Sets the profile menu items
   * - Subscribes to the dialogClosedEvent
   * - Subscribes to the dialogOpenedEvent
   * - Gets viewport changes
   * - Changes dialog title based on state
   */
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
          // this.createToast.emit({ severity: 'success', summary: 'Logged in', detail: 'You are logged in!' });
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

        console.log('Fetching user reviews for:', this.user?.username);

        // Gets the user reviews if the user is not null
        if (this.user?.username) {
          this.getUserReviews(this.user.username);
        }
        
        // console.log(this.reviews)

        // ? Debug log change of current user
        console.log('Profile | Current User:', this.user);
      }
    });

    // Set profile menu items
    this.profileMenuItems = [
        {
          label: 'Profile',
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
          disabled: true,
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
          label: 'Logout',
          icon: 'pi pi-sign-out',
          style: { 'background-color': 'var(--red-300)', 'border-radius': '6px' },
          command: () => {
            this.logout();
          }
        }
    ];

    // Subscribe to the dialogClosedEvent
    this.dialogClosedSubscription = this.dialogClosedEvent.subscribe(() => {
      console.log('Profile | Dialog closed event');
      this.inputUpdateUsername = this.user?.username;
      this.inputEmail = '';
      this.inputPassword = '';
      this.inputPassword2 = '';
      this.isEditingUsername = false;
    });

    // Subscribe to the dialogOpenedEvent
    this.dialogOpenedSubscription = this.dialogOpenedEvent.subscribe(() => {
      console.log('Profile | Dialog opened event');

      // Show the Google Sign In button skeleton when the dialog is opened
      this.showGoogleSkeleton = true;
      // Hide the skeleton after 1 second
      setTimeout(() => { this.showGoogleSkeleton = false; }, 1000);
    });

    // Get viewport changes
    this.viewportService.viewport$.subscribe(type => {
      this.viewportType = type;
    });
    
    // Changing dialog title based on state
    if (this.state == 'signed up') { this.titleChangeEvent.emit('Verify your email'); }
    else if (this.state == 'logged in') { this.titleChangeEvent.emit('Profile'); }
    else if (this.state == 'signed out') { this.titleChangeEvent.emit('Sign Up'); }
    else if (this.state == 'logged out') { this.titleChangeEvent.emit('Login'); }
  }

  /**
   * * Runs on removal of this component
   * 
   * Called when the component is removed. Will clean up all subscriptions and
   * clear the reset email timer.
   */
  ngOnDestroy(): void {
    // Clean up subscriptions to avoid memory leaks
    if (this.userSubscription) { this.userSubscription.unsubscribe(); }
    if (this.dialogClosedSubscription) { this.dialogClosedSubscription.unsubscribe(); }
    if (this.dialogOpenedSubscription) { this.dialogOpenedSubscription.unsubscribe(); }

    // Clear the timer on destroy
    if (this.resetEmailTimer) { clearInterval(this.resetEmailTimer); }
  }



  /** 
   * ! |=======================================================================|
   * ! | GOOGLE AUTHENTICATION                                                 |
   * ! |=======================================================================|
   */

  /** 
   * * Renders the Google Sign In button
   * 
   * Called to render the Google Sign In button asynchronously. This function
   * will attempt to load the Google Sign In button from the Google API. If the
   * Google API is not loaded, it will retry 5 times before setting the error
   * state. If the Google API is loaded, it will render the button.
   * 
   * @param retryCount The number of retries to load the Google API
   * @returns A promise that resolves when the button is rendered
   * @async
   */
  async renderGoogleButton(retryCount: number = 0): Promise<void> {
    try { 
      if (typeof google === 'undefined') {
        if (retryCount > 5) {
          this.googleLoadError = true;
          console.error('Profile | Google Sign In failed to load after 5 retries');
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.renderGoogleButton(retryCount + 1);
      }
      
      this.isGoogleLoading = true;

      await google.accounts.id.initialize({
        client_id: '671526426147-a16p1qi3iq3mtf672f7ka5hlpq8mvl3d.apps.googleusercontent.com',
        // * login_uri is only supported on ux_mode: "redirect", callback is used otherwise
        callback: this.onGoogleSignIn.bind(this),
        // login_uri: "http://localhost:8080/api/v1/auth/google/register",
        ux_mode: "popup",
        itp_support: true,
        use_fedcm_for_prompt: true,
      });

      console.log('Profile | Google Sign In initialized successfully');
  
      // https://developers.google.com/identity/gsi/web/guides/display-button#javascript
      await google.accounts.id.renderButton(
        this.googleSignInButton.nativeElement,
        {
          type: "standard",
          shape: "rectangular",
          theme: "outline",
          text: "sign_in_with",
          size: "large",
          logo_alignment: "left",
          width: "199px",
        }
      );

      console.log('Profile | Google Sign In loaded successfully');
  
      // One tap prompt removed
      //google.accounts.id.prompt();

      this.isGoogleLoading = false;
    }
    catch (error) {
      this.googleLoadError = true;
      this.isGoogleLoading = false;
      console.error('Profile | Google Sign In failed to load:', error);
    }
  }

  /**
   * * On Google Sign In
   */
  onGoogleSignIn(res: any): void {
    const credential = res.credential;
    this.googleAuthenticate(credential);
  }

  /**
   * * Authenticates the user with Google
   * 
   * This function is called when the user signs in with Google. It takes the 
   * credential from Google and sends it to the backend to authenticate the user.
   * 
   * @param credential The credential from Google
   */
  googleAuthenticate(credential: string) {
    this.authService.googleAuthenticate(credential).subscribe({
      next: (response) => {
        // Change state to logged in
        this.state = 'logged in';
        this.titleChangeEvent.emit('Profile');
        this.stateChangeEvent.emit(this.state);
        this.loggingIn = false;

        this.createToast.emit({ severity: 'success', summary: 'Logged in', detail: 'You are logged in!' });

        // ? Debug log success
        console.log('Profile | Logged in succesfully!', response);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status == 409) {
          this.createToast.emit({ severity: 'warn', summary: 'Account exists', detail: "Account exists as non-Google user, please sign in manually." });
        }
        else if (error.status == 403) {
          this.createToast.emit({ severity: 'warn', summary: 'Invalid email', detail: "Please sign in using a Monash University email." });
        }

        // ? Debug log error on signed up
        console.error('Profile | Google Authenticate failed:', error.error);
      }
    });
  }



  /** 
   *  ! |======================================================================|
   *  ! | NORMAL AUTHENTICATION & USER MANAGEMENT                              |
   *  ! |======================================================================|
   */

  /**
   * * Logs out the user
   * 
   * Called to log out the user, will call the logout API from the backend.
   * 
   * On completion it will transfer the state to the 'logged out' state. This
   * shows the user the 'Login' page.
   * 
   * @subscribes authService.logout()
   * @throws {success toast} Logged out when user is logged out
   * @throws {error log} When logout fails
   */
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

  /**
   * * Updates the user's details
   * 
   * Called to update the user's details. Will validate the username and password
   * and send the details thru the backend API.
   * 
   * On completion it will update the user's details and show a success toast.
   * 
   * @subscribes authService.updateDetails(email, username, password)
   * @regex usernameRegex Regular expression to validate the username
   * @throws {success toast} Updated details when details are updated
   * @throws {error toast} Error Updating Details when details fail to update
   */
  updateDetails() {
    if (!this.user || !this.user.username) return

    // Define the empty payload
    const updatePayload: { username?: string, password?: string } = {};

    // Allowable username regular expression
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
      if (this.user)
        this.authService.updateDetails(this.user._id.toString(), updatePayload.username, updatePayload.password).subscribe({
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
      this.createToast.emit({ severity: 'error', summary: 'Invalid username', detail: 'Invalid Username (Please enter an alphanumeric username <= 20 characters)' });
      console.log('Profile | Not a valid username')
    }
  }

  /**
   * * Uploads the user's avatar
   * 
   * Called to upload the user's avatar. Will open a file input and upload the
   * file to the backend API.
   * 
   * On completion it will update the user's profile image and show a success toast.
   * 
   * @subscribes authService.uploadAvatar(file, email)
   * @throws {success toast} Avatar Updated when avatar is updated
   * @throws {error toast} Upload failed when avatar fails to upload
   */
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

  /**
   * * Deletes the user's account
   * 
   * Called to delete the user's account. Will call the backend API to delete 
   * the user's account and log the user out.
   * 
   * @subscribes authService.deleteUserAccount(userId)
   * @throws {success toast} Account deleted
   * @throws {error toast} Error deleting account
   */
  deleteUserAccount() {
    if (!this.user) return;
    
    this.authService.deleteUserAccount(this.user._id.toString()).subscribe({
      next: (response) => {
        window.location.reload();
        this.createToast.emit({ severity: 'success', summary: 'Account Deleted', detail: 'Your account has been deleted successfully.' });
        console.log('Profile | Account deleted successfully', response);
      },
      error: (error) => {
        this.createToast.emit({ severity: 'error', summary: 'Error deleting account', detail: 'There was an error whilst deleting your account' });
        console.error('Profile | Error whilst deleting account', error.message);
      }
    })
  }
  
  /**
   * * Controls the delete account confirmation popup
   * 
   * @param event The event that triggered the confirmation
   * @event confirmService.confirm(options) Opens the confirmation dialog
   * @event confirmService.(options).accept() Runs the accept function
   * @event confirmService.confirm(options).reject() Runs the reject function
   */
  deleteAccountConfirmation(event: Event) {
    this.confirmService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure about this?',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        console.log('Deleting account');
        this.deleteUserAccount();
      },
      reject: () => {
        console.log('User canceled');
      }
    });
  }



  /** 
   *  ! |======================================================================|
   *  ! | REVIEWS HANDLERS                                                     |
   *  ! |======================================================================|
   */

  /**
   * * Gets the user's reviews
   * 
   * Called to get the user's reviews. Will call the backend API to get the user's
   * reviews and store them in the reviews array.
   * 
   * @subscribes apiService.getUserReviewsGET(userID)
   */
  getUserReviews(userID: any) {
    this.apiService.getUserReviewsGET(userID).subscribe(
      (reviews: any) => {
        this.reviews = reviews;

        // Update the reviews property in the user object
        if (this.user)
          this.user.reviews = this.reviews;

        console.log(this.reviews)
      },
      (error: any) => {
        // ? Debug log: Error
        console.log('ERROR DURING: GET Get All Reviews', error)
      }
    );
  }

  /**
   * * Deletes a review
   * 
   * Called to delete a review. Will call the backend API to delete the review
   * and remove it from the reviews array.
   * 
   * @param reviewId The ID of the review to delete
   * @subscribes apiService.deleteReviewByIdDELETE(reviewId)
   * @throws {success toast} Review Deleted when review is deleted
   * @throws {error toast} Error deleting review when review fails to delete
   */
  deleteReview(reviewId: string) {
    this.apiService.deleteReviewByIdDELETE(reviewId).subscribe({
      next: (response: any) => { 
        // Remove the review from the reviews array
        this.reviews = this.reviews.filter(review => review._id !== reviewId);

        // Update the reviews array for the frontend's currentUser
        if (this.user)
          this.user.reviews = this.reviews;

        // Emit a success toast
        this.createToast.emit({ severity: 'success', summary: 'Review Deleted', detail: 'Your review has been deleted successfully.' });

        // ? Debug log: Success
        console.log('Profile | Review deleted successfully', response);
      },
      error: (error: any) => {
        // Emit an error toast
        this.createToast.emit({ severity: 'error', summary: 'Error deleting review', detail: 'There was an error whilst deleting your review' });

        // ? Debug log: Error
        console.error('Profile | Error whilst deleting review', error.message);
      }
    })
  }

  showDialog(review: any) {
    // Restate review and unit to be passed to write-review-unit component
    this.review = new Review(review._id, review.title, review.semester, review.grade, review.year, review.overallRating, review.relevancyRating, review.facultyRating, review.contentRating, review.description, review.author);
    this.unit = review.unit;
    
    // Opens the dialog box if coniditions are met
    if (this.writeReviewDialog && this.user)
      this.writeReviewDialog.openDialog();
  }

  handleReviewEdited() {
    this.reviewEdited.emit();
  }




  /** 
   *  ! |======================================================================|
   *  ! | FRONTEND LOGIC                                                       |
   *  ! |======================================================================|
   */

  /**
   * * Arrow navigation logic
   * 
   * Navigates the profile menu states using the arrows on the profile menu for 
   * tablet and mobile devices.
   */
  navigateMenu(direction: 'prev' | 'next') {
    const currentIndex = this.menuStates.indexOf(this.profileMenuState);
    let newIndex: number;

    if (direction === 'next') {
      newIndex = (currentIndex + 1) % this.menuStates.length;
    } else {
      newIndex = (currentIndex - 1 + this.menuStates.length) % this.menuStates.length; 
    }

    this.profileMenuState = this.menuStates[newIndex] as 'details' | 'reviews' | 'friends' | 'settings';
  }

  /**
   * * Starts editing the username
   * 
   * Called to start editing the username. Will set the isEditingUsername to true
   * and focus on the username input.
   */
  startEditingUsername() {
    this.isEditingUsername = true;
    this.inputUpdateUsername = this.user?.username || '';
    setTimeout(() => {
      this.usernameInput.nativeElement.focus();
    });
  }

  /**
   * * Reloads the page
   */
  reloadPage() {
    return window.location.reload();
  }
}