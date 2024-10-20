import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component'; 
import { FooterComponent } from '../footer/footer.component'; 
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-unit-review-header',
  standalone: true,
  imports: [
    NavbarComponent, 
    FooterComponent, 
    CommonModule, 
    DialogModule, 
    ButtonModule, 
    InputTextModule
  ], 
  templateUrl: './unit-review-header.component.html',
  styleUrls: ['./unit-review-header.component.scss'] 
})
export class UnitReviewHeaderComponent {
  // Input property to receive the unit data from the parent component
  @Input() unit: any;

  // Output property to emit sorting criteria to the partent component (UnitOverviewComponent)
  @Output() sortBy = new EventEmitter<string>();

  /**
   * Handles the sorting action and emits the chosen criteria to the parent component.
   *
   * @param {string} criteria - The criteria to sort by, such as 'recent', 'highest-rating', or 'lowest-rating'.
   */
  onSort(criteria: string) {
    console.log('Sorting by: ', criteria);
    this.sortBy.emit(criteria);
  }

  visible: boolean = false;

  showDialog() {
    this.visible = true;
  }
}
