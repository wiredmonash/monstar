import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { Dropdown, DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { trigger, style, animate, transition } from '@angular/animations';
import { User } from '../../../models/user.model';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-report-review',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ToastModule,
    ButtonModule,
    DropdownModule,
    InputTextareaModule,
    FormsModule
  ],
  providers: [
    MessageService
  ],
  templateUrl: './report-review.component.html',
  styleUrl: './report-review.component.scss',
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
export class ReportReviewComponent {

  // * Input property of current user
  @Input() currentUser: User | null = null;

  // * Input property to receive review data from parent component
  @Input() review!: any;

  // * Input property to receive the visible boolean data from the parent component
  @Input() visible: boolean = false;

  reportReason: string | null = null;
  reportDescription: string | null = null;

  // * Report options
  reportOptions =[
    {
      label: 'Hate Speech',
      value: 'Hate Speech'
    },
    {
      label: 'Trolling / Spam',
      value: 'Trolling / Spam'
    },
    {
      label: 'Harassment / Bullying',
      value: 'Harassment / Bullying'
    },
    {
      label: 'False and/or Misleading Information',
      value: 'False and/or Misleading Information'
    },
    {
      label: 'Inappropriate Content',
      value: 'Inappropriate Content'
    },
    {
      label: 'Private / Confidential Information',
      value: 'Private / Confidential Information'
    },
    {
      label: 'Biased / Unfair Review',
      value: 'Biased / Unfair Review'
    },
    {
      label: 'Duplicate Review',
      value: 'Duplicate Review'
    }
  ]

  constructor (
    private messageService: MessageService,
    private apiService: ApiService
  ) {}

  // * === Opens the create review dialog ===
  openDialog() {
    this.visible = true;
  }

  // * === Closes the create review dialog ===
  closeDialog() {
    this.visible = false;
    this.reportReason = null;
    this.reportDescription = null;
  }

  // * === Called when the dialog is hidden ===
  onDialogHide() {
    this.visible = false;
    this.reportReason = null;
    this.reportDescription = null;
  }

  sendReport() {
    const reportPayload = {
      reportReason: this.reportReason,
      reportDescription: this.reportDescription,
      reporterName: this.currentUser?.username,
      review: this.review
    }

    this.apiService.sendReviewReportPOST(reportPayload);
    this.closeDialog();
    this.reportReason = null;
    this.reportDescription = null;
    this.messageService.add({ key: 'success-toast', severity: 'success', summary: 'Report submitted!', detail: 'Your report has been sent to the admin team.' });
  }
}
