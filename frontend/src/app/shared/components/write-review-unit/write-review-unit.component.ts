import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SEMESTERS } from 'app/shared/models/v2/enums';
import {
  emptyReview,
  ICreateReview,
  IUpdateReview,
} from 'app/shared/models/v2/review.schema';
import { IUnit } from 'app/shared/models/v2/unit.schema';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Dialog, DialogModule } from 'primeng/dialog';
import { Dropdown, DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { RatingModule } from 'primeng/rating';
import { ToastModule } from 'primeng/toast';
import { ViewportService } from '../../services/viewport.service';
import { RatingComponent } from '../rating/rating.component';

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
  providers: [MessageService],
  templateUrl: './write-review-unit.component.html',
  styleUrl: './write-review-unit.component.scss',
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('300ms ease-out', style({ opacity: 0 }))]),
    ]),
  ],
})
export class WriteReviewUnitComponent {
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

  @Input({ required: true }) unit: IUnit | undefined;

  @Input() review: IUpdateReview | undefined = emptyReview();

  @Input({ required: true }) editMode: boolean = false;
  @Input() visible: boolean = false;

  @Output() reviewSubmit = new EventEmitter<ICreateReview>();
  @Output() reviewUpdate = new EventEmitter<IUpdateReview>();

  // List of years to choose from (see initialiseYearOptions)
  yearOptions: Array<{ label: string; value: number }> = [];

  semesterOptions = SEMESTERS.map((s) => ({ label: s, value: s }));

  gradeOptions = [
    { label: 'HD', value: 'HD' },
    { label: 'D', value: 'D' },
    { label: 'C (credit)', value: 'C' },
    { label: 'P (pass)', value: 'P' },
    { label: 'N (fail)', value: 'N' },
  ];

  slideDirection: 'next' | 'prev' = 'next';
  isAnimating: boolean = false;
  stateList = [
    'title',
    'description',
    'semester',
    'year',
    'contentRating',
    'facultyRating',
    'relevancyRating',
    'submit',
  ];
  stateIndex = 0;

  // Stores the last key pressed, used for resetting the rating
  lastKeyPressed: string = '';

  // List of rating types
  ratingTypes = ['relevancyRating', 'facultyRating', 'contentRating'];

  // List of dangerous characters
  dangerousChars = ['{', '}', '/', '>', '<', '+', '\\', '*'];

  get viewportType() {
    return this.viewportService.type();
  }

  private messageService = inject(MessageService);
  private viewportService = inject(ViewportService);

  constructor() {
    this.initialiseYearOptions();
  }

  openDialog() {
    this.visible = true;
    this.focusCurrentInput();

    // Only show the keyboard shortcut helper toast on desktop and laptop viewports
    if (this.viewportType === 'desktop' || this.viewportType === 'laptop') {
      this.messageService.add({
        key: 'helper-toast',
        severity: 'contrast',
        summary: 'Use thee keyboard shortcuts!',
        detail: 'Enter: Next , [ or ]: Navigate , 1-0: Keyboard rate',
        sticky: true,
        closable: false,
      });
    }
  }

  onDialogShow(dialog: Dialog) {
    if (this.viewportType !== 'desktop' && this.viewportType !== 'laptop') {
      dialog.maximize();
    }
  }
  closeDialog() {
    this.visible = false;
  }
  onDialogHide() {
    this.stateIndex = 0;
    this.visible = false;
    this.messageService.clear('helper-toast');
  }

  /**
   * Moves to the next state in the dialog
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
   * Moves to the previous state in the dialog
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

  @HostListener('document:paste', ['$event'])
  handlePaste(event: ClipboardEvent) {
    const currentState = this.stateList[this.stateIndex];
    if (['title', 'description'].includes(currentState)) {
      const pastedText = event.clipboardData?.getData('text');
      if (
        pastedText &&
        this.dangerousChars.some((char) => pastedText.includes(char))
      ) {
        event.preventDefault();
        this.messageService.add({
          key: 'error-toast',
          severity: 'error',
          summary: 'Dangerous characters detected!',
          detail:
            "Please remove any special characters from your input. e.g. '{', '}', '/', '>', '<', '+', '\\', '*'",
        });
      }
    }
  }

  /**
   * Handles key press events
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
      event.preventDefault();
      if (currentState === 'submit') {
        this.submitReview();
      }
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
    if (
      (currentState == 'relevancyRating' ||
        currentState == 'facultyRating' ||
        currentState == 'contentRating') &&
      this.review
    ) {
      const keyRatingMap: { [key: string]: number } = {
        '1': 0.5,
        '2': 1,
        '3': 1.5,
        '4': 2,
        '5': 2.5,
        '6': 3,
        '7': 3.5,
        '8': 4,
        '9': 4.5,
        '0': 5,
      };

      if (event.key in keyRatingMap) {
        const ratingValue = keyRatingMap[event.key];

        if (
          this.lastKeyPressed === event.key &&
          this.review[currentState] === ratingValue
        ) {
          // Reset the rating if same key is pressed twice
          this.review[currentState] = 0;
        } else {
          // Set new rating
          this.review[currentState] = ratingValue;
        }

        this.lastKeyPressed = event.key;
      }
    }
  }

  submitReview() {
    if (!this.review || !this.unit) return;

    const ratings = [
      this.review.relevancyRating,
      this.review.facultyRating,
      this.review.contentRating,
    ].filter((r) => r > 0);

    if (ratings.length > 0) {
      const sum = ratings.reduce((acc, curr) => acc + curr, 0);
      this.review.overallRating = Number((sum / ratings.length).toFixed(1));
    }

    // Emit to parent (unit-review-header or review-card)
    if (this.editMode) {
      this.reviewUpdate.emit(this.review);
    } else {
      this.reviewSubmit.emit(this.review as ICreateReview);
    }

    this.closeDialog();
  }

  private initialiseYearOptions(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 10; i--)
      this.yearOptions.push({ label: i.toString(), value: i });
  }
}
