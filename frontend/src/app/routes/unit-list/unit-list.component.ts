import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { UnitCardComponent } from "../../shared/components/unit-card/unit-card.component";
import { ApiService } from '../../../api.service';

@Component({
  selector: 'app-unit-list',
  standalone: true,
  imports: [
    UnitCardComponent,
  ],
  templateUrl: './unit-list.component.html',
  styleUrl: './unit-list.component.scss'
})
export class UnitListComponent implements OnInit {
  units: any[] = []; // Array to hold the unit data

  /**
   * Constructor to initialise the API service.
   * @param apiService Injects the ApiService to communicate with the backend.
   */
  constructor(private apiService: ApiService) { }

  /**
   * Angular lifecycle hook called after the component has been initalised.
   * This method is used to trigger data fetching when the component loads.
   */
  ngOnInit(): void {
    this.fetchAllUnits(); // Fetches all the units from the backend
  }

  /**
   * Fetch all units from the backend and update the units array.
   * Utlises the ApiService to make an HTTP GET request.
   */
  fetchAllUnits() {
    this.apiService.getAllUnits().subscribe({
      next: (response: any[]) => {
        // On successful response, assign data to units array.
        this.units = response;
      },
      error: (error) => {
        // Log an error if something goes wrong while fetching units.
        console.error('Error fetching units:', error);
      }
    });
  }
}
