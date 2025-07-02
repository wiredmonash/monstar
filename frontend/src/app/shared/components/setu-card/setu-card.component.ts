import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

// PrimeNG modules
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule }    from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { Unit } from '../../models/unit.model';

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
  // Take the Unit input from unit overview (to get unitcode)
  @Input() unit?: Unit;

  constructor (
    private router: Router
  ) {}

  // View SETU overview in a new tab
  // This is a placeholder URL, replace with the actual SETU overview link
  goToSetuOverview(event: MouseEvent) {
    if (!this.unit) return;
    const thisUnitCode = this.unit.unitCode;

    event.stopPropagation(); // prevent accordion toggle
    // window.open('https://www.google.com/', '_blank'); // or _self to open in same tab
    this.router.navigate(['setu', thisUnitCode]);
  }
}

