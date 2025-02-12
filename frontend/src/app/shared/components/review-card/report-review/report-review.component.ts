import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { Dropdown, DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';
import { trigger, style, animate, transition } from '@angular/animations';

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

  // * Input property to receive review data from parent component
  @Input() review!: any;

  // * Input property to receive the visible boolean data from the parent component
  @Input() visible: boolean = false;

  // * Report options
  reportOptions =[
    {
      label: 'Hate Speech',
      value: 'Hate Speech'
    },
    {
      label: 'Trolling',
      value: 'Trolling'
    },
    {
      label: 'Not helpful',
      value: 'Not helpful'
    }
  ]

  constructor (
    private messageService: MessageService
  ) {}

  // * === Opens the create review dialog ===
  openDialog() {
    this.visible = true;
    // this.focusCurrentInput(); // ! DEAL WITH THIS
  }

  // * === Closes the create review dialog ===
  closeDialog() {
    this.visible = false;
  }

  // * === Called when the dialog is hidden ===
  onDialogHide() {
    this.visible = false;
  }

  sendReport() {
    console.log("placeholder send report");
    this.closeDialog();
    this.messageService.add({ key: 'success-toast', severity: 'success', summary: 'Report submitted!', detail: 'Your report has been sent to the admin team.' });
  }
}
