import { Component } from '@angular/core';
import { SetuMainComponent } from '../../shared/components/setu-main/setu-main.component';

@Component({
  selector: 'app-setu',
  standalone: true,
  imports: [SetuMainComponent],
  template: '<app-setu-main></app-setu-main>',
  styleUrl: './setu.component.scss',
})
export class SetuComponent {}
