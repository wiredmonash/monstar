import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Dialog, DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { RatingModule } from 'primeng/rating';
import { ApiService } from '../../services/api.service';
import { Review } from '../../models/review.model';
import { Dropdown, DropdownModule } from 'primeng/dropdown';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { trigger, style, animate, transition } from '@angular/animations';
import { RatingComponent } from '../rating/rating.component';
import { AutoFocusModule } from 'primeng/autofocus';
import { ViewportService, ViewportType } from '../../services/viewport.service';

@Component({
  selector: 'app-write-review-unit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    RatingModule,
    DropdownModule,
    ToastModule,
    RatingComponent,
  ],
  providers: [
    MessageService
  ],
  templateUrl: './write-review-unit.component.html',
  styleUrl: './write-review-unit.component.scss',
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class WriteReviewUnitComponent implements OnInit {
  // View children for the input fields and buttons
  @ViewChild('titleInput') titleInput?: ElementRef;
  @ViewChild('semesterInput') semesterInput?: Dropdown;
  @ViewChild('gradeInput') gradeInput?: Dropdown;
  @ViewChild('yearInput') yearInput?: Dropdown;
  @ViewChild('descriptionInput') descriptionInput?: ElementRef;
  @ViewChild('relevancyRatingInput') relevancyRatingInput!: ElementRef;
  @ViewChild('facultyRatingInput') facultyRatingInput!: ElementRef;
  @ViewChild('contentRatingInput') contentRatingInput!: ElementRef;
  @ViewChild('submitReviewButton') submitReviewButton?: ElementRef;

  // Input property to receive the unit data from the parent component
  @Input() unit?: any;

  @Input() editMode: boolean = false;

  // Input property to receive the visible boolean data from the parent component
  @Input() visible: boolean = false;

  // Input property to receive the current user data from the parent component
  @Input() user: User | null = null;

  // Event to notify that the review was posted
  @Output() reviewPosted = new EventEmitter<void>();

  @Output() reviewEdited = new EventEmitter<void>(); 

  // Review object and it's properties
  @Input() review: Review = new Review();

  // List of years to choose from (see initialiseYearOptions)
  yearOptions: Array<{ label: string; value: number }> = [];

  // The options for the semester dropdown
  semesterOptions = [{ label: 'First semester', value: 'First semester' },{ label: 'Second semester', value: 'Second semester' },{ label: 'Summer semester A', value: 'Summer semester A' },{ label: 'Summer semester B', value: 'Summer semester B' },{ label: 'Research quarter 1', value: 'Research quarter 1' },{ label: 'Research quarter 2', value: 'Research quarter 2' },{ label: 'Research quarter 3', value: 'Research quarter 3' },{ label: 'Research quarter 4', value: 'Research quarter 4' },{ label: 'Winter semester', value: 'Winter semester' },{ label: 'Full year', value: 'Full year' },{ label: 'First semester (Northern)', value: 'First semester (Northern)' },{ label: 'Trimester 2', value: 'Trimester 2' },{ label: 'Second semester to First semester', value: 'Second semester to First semester' },{ label: 'Term 1', value: 'Term 1' },{ label: 'Term 2', value: 'Term 2' },{ label: 'Term 3', value: 'Term 3' },{ label: 'Trimester 3', value: 'Trimester 3' },{ label: 'Teaching period 3', value: 'Teaching period 3' },{ label: 'Teaching period 4', value: 'Teaching period 4' },{ label: 'Teaching period 5', value: 'Teaching period 5' }];

  // The options for the grade dropdown
  gradeOptions = [{ label: 'HD', value: 'HD' },{ label: 'D', value: 'D' },{ label: 'C (credit)', value: 'C' },{ label: 'P (pass)', value: 'P' },{ label: 'N (fail)', value: 'N' }];

  // The direction of the slide animation
  slideDirection: 'next' | 'prev' = 'next';
  // Whether the dialog is currently animating
  isAnimating: boolean = false;

  // State of the dialog
  stateList = ['title', 'description', 'semester', 'year', 'contentRating', 'facultyRating', 'relevancyRating', 'submit'];
  stateIndex = 0;

  // Stores the last key pressed, used for resetting the rating
  lastKeyPressed: string = '';

  // List of rating types
  ratingTypes = ['relevancyRating', 'facultyRating', 'contentRating'];

  // List of dangerous characters
  dangerousChars = ['{', '}', '/', '>', '<', '+', '\\', '*'];

  // Viewport type
  viewportType: ViewportType = 'desktop';

  /** 
   * === Constructor ===
   * - Calls initialiseYearOptions
   */
  constructor (
    private apiService: ApiService,
    private authService: AuthService,
    private messageService: MessageService,
    private viewportService: ViewportService
  ) {
    this.initialiseYearOptions();
  } 

  /**
   * * Runs on initialisation
   * 
   * - Subscribes to the viewport service to get the viewport type.
   */
  ngOnInit(): void {
    // Get the viewport type from the viewport service
    this.viewportService.viewport$.subscribe(type => {
      this.viewportType = type;
    });
  }

  /**
   * * Opens the dialog
   * 
   * - Sets the visible property to true.
   * - Calls the focusCurrentInput method.
   * - Adds a toast message for the keyboard shortcuts (only for desktop and laptop)
   */
  openDialog() {
    this.visible = true;
    this.focusCurrentInput();

    // Only show the keyboard shortcut helper toast on desktop and laptop viewports
    if (this.viewportType === 'desktop' || this.viewportType === 'laptop') {
      this.messageService.add({ key: 'helper-toast', severity: 'contrast', summary: 'Use thee keyboard shortcuts!', detail: 'Enter: Next , [ or ]: Navigate , 1-0: Keyboard rate', sticky: true, closable: false });
    }
  }

  /**
   * * Called when the dialog is shown
   * 
   * - Maximises the dialog if the viewport is not desktop or laptop.
   */
  onDialogShow(dialog: Dialog) {
    if (this.viewportType !== 'desktop' && this.viewportType !== 'laptop') {
      dialog.maximize();
    }
  }

  // === Closes the create review dialog ===
  closeDialog() {
    this.visible = false;
  }

  // === Called when the dialog is hidden ===
  onDialogHide() {
    this.stateIndex = 0;
    this.visible = false;
    this.messageService.clear('helper-toast');
  }

  /** 
   * === Moves to the next state in the dialog ===
   * 
   * - Checks if the current state is not the last state in the stateList array.
   * - Adds the slide-next-leave class to the content div.
   * - Waits for 300ms and increments the stateIndex.
   * - Removes the slide-next-leave class and adds the slide-next-enter class.
   * - Waits for 300ms and removes the slide-next-enter class.
   * - Sets isAnimating to false.
   */
  nextState() {
    if (this.stateIndex < this.stateList.length - 1 && !this.isAnimating) {
        this.isAnimating = true;
        const content = document.querySelector('.dialog-content > div');
        content?.classList.add('slide-next-leave');
        
        setTimeout(() => {
            this.stateIndex++;
            content?.classList.remove('slide-next-leave');
            content?.classList.add('slide-next-enter');
            this.focusCurrentInput();
            
            setTimeout(() => {
                content?.classList.remove('slide-next-enter');
                this.isAnimating = false;
            }, 100);
        }, 300);
    }
  }

  /**
   * === Moves to the previous state in the dialog ===
   * 
   * - Checks if the current state is not the first state in the stateList array.
   * - Adds the slide-prev-leave class to the content div.
   * - Waits for 300ms and decrements the stateIndex.
   * - Removes the slide-prev-leave class and adds the slide-prev-enter class.
   * - Waits for 300ms and removes the slide-prev-enter class.
   * - Sets isAnimating to false.
   */
  prevState() {
      if (this.stateIndex > 0 && !this.isAnimating) {
          this.isAnimating = true;
          const content = document.querySelector('.dialog-content > div');
          content?.classList.add('slide-prev-leave');
          
          setTimeout(() => {
              this.stateIndex--;
              content?.classList.remove('slide-prev-leave');
              content?.classList.add('slide-prev-enter');
              this.focusCurrentInput();
              
              setTimeout(() => {
                  content?.classList.remove('slide-prev-enter');
                  this.isAnimating = false;
              }, 100);
          }, 300);
      }
  }

  /**
   * === Focuses the current input based on the stateIndex ===
   * 
   * - Uses a setTimeout to focus the input after 500ms.
   * - Switches the stateList[stateIndex] to focus the correct input.
   */
  focusCurrentInput() { 
    setTimeout(() => { 
      switch (this.stateList[this.stateIndex]) { 
        case 'title':
          this.titleInput?.nativeElement.focus();
          break;
        case 'description':
          this.descriptionInput?.nativeElement.focus();
          break;
        case 'semester':
          if (!this.isAnimating) {
            this.semesterInput?.focus();
            this.semesterInput?.show();
          }
          break;
        case 'year':
          if (!this.isAnimating) {
            this.yearInput?.focus();
            this.yearInput?.show();
          }
          break;
        case 'grade': // ! REMOVED
          if (!this.isAnimating) {
            this.gradeInput?.focus();
            this.gradeInput?.show();
          }
          break;
        case 'submit':
          this.submitReviewButton?.nativeElement.focus();
          break;
      }
    }, 500);
  }

  /**
   * === Handles paste events ===
   */
  @HostListener('document:paste', ['$event'])
  handlePaste(event: ClipboardEvent) {
    // Get current state
    const currentState = this.stateList[this.stateIndex];

    // Only check paste for title and description
    if (['title', 'description'].includes(currentState)) {
      const pastedText = event.clipboardData?.getData('text');

      // Check if pasted content contains dangerous characters
      if (pastedText && this.dangerousChars.some(char => pastedText.includes(char))) {
        event.preventDefault();
        this.messageService.add({ key: 'error-toast', severity: 'error', summary: 'Dangerous characters detected!', detail: "Please remove any special characters from your input. e.g. '{', '}', '/', '>', '<', '+', '\\', '*'"});
      }
    }
  }

  /**
   * === Handles key press events === 
   * 
   * - If the key pressed is 'Enter', it will submit the review if the current state is 'submit'.
   * - If the key pressed is a number from 1-5, it will set the rating for the current state.
   * - If the same key is pressed twice, it will reset the rating.
   * 
   * @param event KeyboardEvent
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyPress(event: KeyboardEvent) {
    const currentState = this.stateList[this.stateIndex];

    // * Enter key handling
    if (event.key === 'Enter') {
      // Allow SHIFT + ENTER in the description state
      if (currentState === 'description' && event.shiftKey) { 
        return;
      }

      // Prevent the default action of the enter key
      event.preventDefault();

      // If the current state is 'submit', post the review
      if (currentState === 'submit') {
        // console.log(this.editMode);
        if (this.editMode) {
          return this.editReview();
        }
        return this.postReview();
      }

      // Move to the next state if the current state is not 'submit'
      this.nextState();
    }

    // * Left and right arrow keys
    if (event.key === '[') {
      event.preventDefault();
      this.prevState();
    }
    if (event.key === ']') {
      event.preventDefault();
      this.nextState();
    }

    // * Prevent special characters in input fields
    if (['{', '}', '/', '>', '<', '+', '\\', '*'].includes(event.key)) {
      event.preventDefault();
    }

    // * Ratings handling
    if (currentState == 'relevancyRating' || currentState == 'facultyRating' || currentState == 'contentRating') {
      const keyRatingMap: { [key: string]: number} = { '1': 0.5, '2': 1, '3': 1.5, '4': 2, '5': 2.5, '6': 3, '7': 3.5, '8': 4, '9': 4.5, '0': 5 };

      if (event.key in keyRatingMap) { 
        const ratingValue = keyRatingMap[event.key];

        if (this.lastKeyPressed === event.key && (this.review as any)[currentState] === ratingValue) {
          // Reset the rating if same key is pressed twice
          (this.review as any)[currentState] = 0;
        } else {
          // Set new rating
          (this.review as any)[currentState] = ratingValue;
        }

        this.lastKeyPressed = event.key;
      }
    }

  }

  editReview() {
    //Checking if user is logged in
    if (!this.user) {
      // console.error('User data not available.');
      return;
    }

    //Checking if unit is assigned to us
    if (!this.unit) {
      // console.error('Unit data not available.');
      return;
    }

    // Ensure all defaults are set in the review object
    this.review.ensureDefaults();

    // Push the new review to the currentUser's reviews array
    this.user.reviews.push(this.review._id);

    // ? Debug log
    // console.log('Updating review:', this.review);

    // Calculate the overall rating
    this.review.calcOverallRating();

    // Send the review using the API service
    this.apiService.editReviewPUT(this.review).subscribe({
      next: (response) => {
        // Update the current user in AuthService
        this.authService.setCurrentUser(this.user!);

        // ? Debug log
        // console.log('WriteReviewUnit | Update current user:', this.user);

        // Close the pop up write review
        this.closeDialog();

        // Emit that we posted the review
        this.reviewEdited.emit();

        // Show success toast 
        this.messageService.add({ key: 'success-toast', severity: 'success', summary: 'Review Modified!', detail: 'Review has been published publicly' });

        // Reset form after successful submission
        this.review = new Review();
      },
      error: (error) => { 
        // Show error toast 
        this.messageService.add({ key: 'error-toast', severity: 'error', summary: 'Failed to submit review :(', detail: 'Make sure you give it a title and description dummy!' });
      }
    });

  }

  /**
   * === Posts the Review (to the backend) ===
   * 
   * This method checks if:
   * - we are currently creating a review FOR a unit.
   * - we have default values for the review.
   * - we have valid values for the review.
   * 
   * Also calculates the overallRating using the Review model's calcOverallRating
   * helper method.
   * 
   * If all checks pass, it sends the review to the backend.
   * 
   * Pushes the review to the frontend currentUser's reviews array as well.
   * 
   * @subscribes apiService.createReviewForUnitPOST
   */
  postReview() {
    // Checking if user is logged in
    if (!this.user) {
      // console.error('User data not available.');
      return;
    }

    // Checking if unit is assigned to us
    if (!this.unit) {
      // console.error('Unit data not available.');
      return;
    }

    // Ensure all defaults are set in the review object
    this.review.ensureDefaults();

    // Validating values
    // if (!this.review.isValid()) {
    //   console.error('Please fill out all fields before submitting the review, and please check your values.')
    //   return;
    // }

    // Set review author user
    this.review.author = this.user._id;

    // Push the new review to the currentUser's reviews array
    this.user.reviews.push(this.review._id);

    // ? Debug log
    // console.log('Posting review:', this.review);

    // Calculate the overall rating
    this.review.calcOverallRating();

    // Send the review using the API service
    this.apiService.createReviewForUnitPOST(this.unit.unitCode, this.review).subscribe({
      next: (data) => {
        // Create the review object from the response
        const review = new Review(data);

        // Update the user's reviews array
        this.user!.reviews.push(review._id);

        // Update the current user in AuthService
        this.authService.setCurrentUser(this.user!);

        // ? Debug log
        // console.log('WriteReviewUnit | Update current user:', this.user);

        // Close the pop up write review
        this.closeDialog();

        // Emit that we posted the review
        this.reviewPosted.emit();

        // Show success toast 
        this.messageService.add({ key: 'success-toast', severity: 'success', summary: 'Review submitted!', detail: 'Review has been published publicly' });

        // Reset form after successful submission
        this.review = new Review();
      },
      error: (error) => { 
        // Show error toast 
        this.messageService.add({ key: 'error-toast', severity: 'error', summary: 'Failed to submit review :(', detail: 'Make sure you give it a title and description dummy!' });
      }
    });
  }

  /**
   * === Creates the multiple previous years from current year. ===
   * 
   * - Pushes the values to the yearOptions array.
   * - This is used for the year dropdown option.
   * 
   * @private
   */
  private initialiseYearOptions(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 10; i--)
      this.yearOptions.push({ label: i.toString(), value: i });
  }
}
