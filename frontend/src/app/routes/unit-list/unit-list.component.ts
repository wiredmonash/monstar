import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
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
import { Dropdown } from 'primeng/dropdown';

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
    CommonModule,
  ],
  templateUrl: './unit-list.component.html',
  styleUrl: './unit-list.component.scss',
})
export class UnitListComponent implements OnInit {
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

  // Sort by dropdown reference
  @ViewChild('sortByDropdown') sortByDropdown!: Dropdown;
  // Is sort by dropdown focused?
  isSortByFocused: boolean = false;
  // Is search bar focused?
  isSearchFocused: boolean = false;

  // NgModel value for the sort by dropdown (default: Alphabetic)
  sortBy: string = 'Alphabetic'; 

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
    // Retrieve the sortBy state from local storage
    const savedSortBy = localStorage.getItem('sortBy');
    if (savedSortBy) 
      this.sortBy = savedSortBy;

    // Fetches the paginated units from the backend
    this.fetchPaginatedUnits(); 
  }

  /**
   * * Fetch paginated units from the backend and update the filteredUnits array.
   * 
   * Utilies the ApiService to make a HTTP GET request.
   */
  fetchPaginatedUnits() {
    const searchLower = this.search.toLowerCase();
    this.loading = true;
  
    this.apiService.getUnitsFilteredGET(this.first, this.rows, searchLower, this.sortBy).subscribe({
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

  /**
   * * Handles focusing via keybinds
   * 
   * - CTRL + K: Focuses on search bar
   * - CTRL + F: Focuses on sort by dropdown
   * - Escape: Unfocuses all elements
   * - Enter: Searches if focused on search bar 
   * 
   * @HostListener 
   * @param event Keyboard event
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Search bar html element
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;

    // Focuses on search bar
    if (event.ctrlKey && event.key === 'k') {
      event.preventDefault();
      if (searchInput) {
        searchInput.focus();
        this.sortByDropdown.hide(); // We hide the dropdown if we focus on the search bar.
      }
    }
    // Focuses on sort by dropdown
    if (event.ctrlKey && event.key === 'f') {
      event.preventDefault();
      if (this.sortByDropdown)
        this.sortByDropdown.focus();
    }
    // Unfocuses on all
    if (event.key === 'Escape') {
      event.preventDefault();
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement)
        activeElement.blur();
    }
    if (event.key == 'Enter') {
      if (this.isSearchFocused && this.search) {
        this.filterUnits();
      }
    }
  }

  /**
   * * Handles changes on sortBy dropdown change
   * 
   * - Saves the sortBy option to localStorage
   * - Fetches paginated units again to refresh
   */
  onSortByChange() {
    localStorage.setItem('sortBy', this.sortBy);
    this.fetchPaginatedUnits();
  }
}
