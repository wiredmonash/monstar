import { Component } from '@angular/core';

// PrimeNG modules
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule }    from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-setu-card',
  standalone: true,
  imports: [
    AccordionModule,
    ButtonModule,
    ProgressBarModule
  ],
  templateUrl: './setu-card.component.html',
  styleUrl: './setu-card.component.scss'
})
export class SetuCardComponent {
  // View SETU overview in a new tab
  // This is a placeholder URL, replace with the actual SETU overview link
  goToSetuOverview(event: MouseEvent) {
    event.stopPropagation(); // prevent accordion toggle
    window.open('https://www.google.com/', '_blank'); // or _self to open in same tab
  }
}

