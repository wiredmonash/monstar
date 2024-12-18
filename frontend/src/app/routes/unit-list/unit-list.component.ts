import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { UnitCardComponent } from "../../shared/components/unit-card/unit-card.component";
import { ApiService } from '../../shared/services/api.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToolbarModule } from 'primeng/toolbar';
import { SplitButtonModule } from 'primeng/splitbutton';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unit-list',
  standalone: true,
  imports: [
    UnitCardComponent,
    ProgressSpinnerModule,
    ToolbarModule,
    ButtonModule,
    SplitButtonModule,
    InputTextModule,
    FormsModule,
    PaginatorModule,
    SkeletonModule,
    CommonModule
  ],
  templateUrl: './unit-list.component.html',
  styleUrl: './unit-list.component.scss'
})
export class UnitListComponent implements OnInit {
  // Array to hold the full list of units from the backend
  units: any[] = []; 
  // Array to hold the filtered list of units
  filteredUnits: any[] = []; 

  // String to hold the current search
  search: string = ''; 

  // Current page
  first: number = 0; 
  // Number of unit cards shown on the page
  rows: number = 20; 
  // Total number of unit cards
  totalRecords: number = 0; 

  // Loading state of unit cards
  loading: boolean = true;
  testing: boolean = true;

  // Skeletons for loading state
  skeletons: any[] = new Array(6);

  /**
   * * Constructor
   * 
   * @param apiService Injects the ApiService to communicate with the backend APIs
   */
  constructor(private apiService: ApiService) { }

  /**
   * * Angular lifecycle hook called after the component has been initalised.
   * 
   * This method is used to trigger data fetching when the component loads.
   */
  ngOnInit(): void {
    this.fetchPaginatedUnits(); // Fetches all the units from the backend
  }

  /**
   * * Fetch all units from the backend and update the units array. (NOT USED)
   * 
   * Utlises the ApiService to make an HTTP GET request.
   */
  fetchAllUnits() {
    this.loading = true;
    this.apiService.getAllUnits().subscribe({
      next: (response: any[]) => {
        // On successful response, assign data to units array.
        this.units = response;
        this.totalRecords = response.length;
        this.filteredUnits = this.units;

        this.loading = false;

        console.log('Fetched all units:', this.units);
      },
      error: (error) => {
        // Log an error if something goes wrong while fetching units.
        console.error('Error fetching units:', error);
      }
    });
  }

  /**
   * * Fetch paginated units from the backend and update the filteredUnits array.
   * 
   * Utilies the ApiService to make a HTTP GET request.
   */
  fetchPaginatedUnits() {
    const searchLower = this.search.toLowerCase();
    this.loading = true;
  
    this.apiService.getUnitsFilteredGET(this.first, this.rows, searchLower).subscribe({
      next: (response: any) => {
        this.filteredUnits = response.units;
        this.totalRecords = response.total;
        this.loading = false;
      },
      error: (error) => {
        if (error.status == 404) {
          this.filteredUnits = [];
          this.totalRecords = 0;
          console.error('No matching units found:', error.message);
        }

        console.error('Error fetching units:', error);
        this.loading = false;
      }
    });
  }

  /**
   * * Updates the filteredUnits array based on the current search query
   */
  filterUnits() {
    this.first = 0;
    this.fetchPaginatedUnits();
  }

  /**
   * * Handle paginator page change.
   * 
   * @param event Paginator event containing the new `first` and `rows` values
   */
  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
    this.fetchPaginatedUnits();
  }
}
