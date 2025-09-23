import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { Dropdown, DropdownModule } from 'primeng/dropdown';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MultiSelectModule } from 'primeng/multiselect';
import { FloatLabelModule } from 'primeng/floatlabel';
import { Unit, UnitData } from '../../shared/models/unit.model';
import { ScrollTopModule } from 'primeng/scrolltop';
import { Meta, Title } from '@angular/platform-browser';
import { ViewportService } from '../../shared/services/viewport.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BASE_URL, META_BASIC_DESCRIPTION, META_BASIC_KEYWORDS, META_BASIC_OPEN_GRAPH_DESCRIPTION, META_BASIC_TITLE, META_BASIC_TWITTER_TITLE, META_UNIT_LIST_TITLE } from '../../shared/constants';
import { scrollToTop } from '../../shared/helpers';

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
    OverlayPanelModule,
    InputSwitchModule,
    DropdownModule,
    MultiSelectModule,
    FloatLabelModule,
    ScrollTopModule,
  ],
  templateUrl: './unit-list.component.html',
  styleUrl: './unit-list.component.scss',
})
export class UnitListComponent implements OnInit, OnDestroy {
  // Array to hold the filtered list of units
  filteredUnits: Unit[] = []; 

  // String to hold the current search
  search: string = ''; 

  // Current page
  first: number = 0; 
  // Total no. of rows of unit cards shown on the page
  rows: number = 20; 
  // Total number of unit cards
  totalRecords: number = 0; 

  // Loading state of unit cards
  loading: boolean = true;
  testing: boolean = true;

  // Sort by dropdown reference
  @ViewChild('sortByDropdown') sortByDropdown!: Dropdown;
  // Is sort by dropdown focused?
  isSortByFocused: boolean = false;
  // Is search bar focused?
  isSearchFocused: boolean = false;

  // NgModel value for the sort by dropdown (default: Alphabetic)
  sortBy: string = 'Most Reviews'; 

  // Advanced filtering overlay panel reference
  @ViewChild('op') overlayPanel!: OverlayPanel;
  // Advanced filtering button reference
  @ViewChild('filterButton', { read: ElementRef }) filterButton!: ElementRef;

  // Showing reviewed units
  showReviewed: boolean = false;
  // Showing unreviewed units
  showUnreviewed: boolean = false;
  // Hiding no offerings units
  hideNoOfferings: boolean = false;

  // Choice of faculties
  faculties: string[] = ['Art, Design and Architecture', 'Arts', 'Business and Economics', 'Education', 'Engineering', 'Information Technology', 'Law', 'Medicine, Nursing and Health Sciences', 'Pharmacy and Pharmaceutical Sciences', 'Science'];
  selectedFaculty: any = null;

  // Choice of semesters
  semesters: string[] = ['First semester', 'Second semester', 'Summer semester A', 'Summer semester B', 'Research quarter 1', 'Research quarter 2', 'Research quarter 3', 'Research quarter 4', 'Winter semester', 'Full year', 'First semester (Northern)', 'Trimester 2', 'Second semester to First semester', 'Term 1', 'Term 2', 'Term 3', 'Trimester 3', 'Teaching period 3', 'Teaching period 4', 'Teaching period 5'];
  selectedSemesters: any = null;

  // Choice of campuses
  campuses: string[] = ['Clayton', 'Caulfield', 'Malaysia', 'Overseas', 'Peninsula', 'City (Melbourne)', 'Alfred Hospital', 'Monash Online', 'Monash Medical Centre', 'Monash Law Chambers', 'Notting Hill', 'Parkville', 'Hudson Institute of Medical Research', 'Gippsland', 'Indonesia', 'Box Hill', 'Warragul', 'Prato', 'Suzhou (SEU)', 'Southbank', 'Moe'];
  selectedCampuses: any = null;

  // Ratings
  ratings: number[] = [1,2,3,4,5];
  selectedRating: number = 0;

  // Prerequisites
  hasPrerequisites: boolean = false;

  // Viewport type
  viewportType: string = 'desktop';

  // Debouncing search
  private searchSubject = new Subject<string>();

  /**
   * ! Constructor
   */
  constructor(
    private apiService: ApiService,
    private meta: Meta,
    private titleService: Title,
    private viewportService: ViewportService,
    private route: ActivatedRoute,
    private router: Router,
  ) { }


  /** 
   *  ! |======================================================================|
   *  ! | LIFECYCLE HOOKS                                                            
   *  ! |======================================================================|
   */

  /**
   * * Angular lifecycle hook called after the component has been initalised.
   * 
   * This method is used to trigger data fetching when the component loads.
   */
  ngOnInit(): void {
    // Update meta tags for this page
    this.updateMetaTags();

    // Setup the debounced search
    this.searchSubject.pipe(
      debounceTime(400), // Wait 400ms after the user stops typing
      distinctUntilChanged() // Only emit if the search string changed
    ).subscribe(searchTerm => {
      this.updateSearchQueryParams(searchTerm);
      this.filterUnits();
    });

    // Subscribe to route paramter changes
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        if (this.search !== params['search']) {
          this.search = params['search'];
          this.fetchPaginatedUnits();
        } 
      } else if (this.search) {
        this.search = '';
      }
    });

    // Retrieve the sortBy state from local storage
    const savedSortBy = localStorage.getItem('sortBy');
    if (savedSortBy) 
      this.sortBy = savedSortBy;

    // Retrieve the rows per page state from local storage
    const savedRowsPerPage = localStorage.getItem('rowsPerPage');
    if (savedRowsPerPage)
      this.rows = JSON.parse(savedRowsPerPage);

    // Retrieve the selected faculty from local storage
    const savedFaculty = localStorage.getItem('selectedFaculty');
    if (savedFaculty)
      this.selectedFaculty = JSON.parse(savedFaculty);

    // Retrieve the selected semesters from local storage
    const savedSemesters = localStorage.getItem('selectedSemesters');
    if (savedSemesters)
      this.selectedSemesters = JSON.parse(savedSemesters);

    // Retrieve the selected campuses from local storage
    const savedCampuses = localStorage.getItem('selectedCampuses');
    if (savedCampuses)
      this.selectedCampuses = JSON.parse(savedCampuses);

    // Fetches the paginated units from the backend
    this.fetchPaginatedUnits(); 

    // Subscribe to the viewport service and get the viewport type
    this.viewportService.viewport$.subscribe(type => {
      this.viewportType = type;
    });
  }

  /**
   * * Angular lifecycle hook called on deletion
   */
  ngOnDestroy(): void {
    // Reset title
    this.titleService.setTitle('MonSTAR | Browse and Review Monash University Units');
    
    // Remove all custom meta tags
    this.meta.removeTag("name='description'");
    this.meta.removeTag("name='keywords'");
    this.meta.removeTag("property='og:title'");
    this.meta.removeTag("property='og:description'");
    this.meta.removeTag("property='og:url'");
    this.meta.removeTag("property='og:type'");
    this.meta.removeTag("name='twitter:card'");
    this.meta.removeTag("name='twitter:title'");
    this.meta.removeTag("name='twitter:description'");

    // Unsubscribe from the subject
    this.searchSubject.complete();
  }


  /** 
   *  ! |======================================================================|
   *  ! | PAGINATION & UNITS RETRIEVAL                                                     
   *  ! |======================================================================|
   */

  /**
   * * Fetch paginated units from the backend and update the filteredUnits array.
   * 
   * Utilies the ApiService to make a HTTP GET request.
   */
  fetchPaginatedUnits() {
    const searchLower = this.search.toLowerCase();
    this.loading = true;

    // ? Debug log the fetch request details
    // console.log('UnitList | Fetching units:', this.first, this.rows, searchLower, this.sortBy, this.showReviewed, this.showUnreviewed, this.hideNoOfferings, this.selectedFaculty, this.selectedSemesters, this.selectedCampuses);
    
    // Fetch the paginated units from the backend
    this.apiService.getUnitsFilteredGET(this.first, this.rows, searchLower, this.sortBy, this.showReviewed, this.showUnreviewed, this.hideNoOfferings, this.selectedFaculty, this.selectedSemesters, this.selectedCampuses).subscribe({
      next: (response: any) => {
        // Map the response data to Unit objects
        this.filteredUnits = response.units.map((unitData: UnitData) => new Unit(unitData));

        // Update the total records
        this.totalRecords = response.total;

        // Not loading anymore
        this.loading = false;

        // ? Debug log success
        // console.log('UnitList | Fetched units:', this.filteredUnits);
      },
      error: (error) => {
        if (error.status == 404) {
          this.filteredUnits = [];
          this.totalRecords = 0;
          // console.error('No matching units found:', error.message);
        }

        // console.error('Error fetching units:', error);
        this.loading = false;
      }
    });
  }

  onSearchInput() {
    this.searchSubject.next(this.search);
  }

  updateSearchQueryParams(searchTerm: string) {
    if (searchTerm) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { search: searchTerm },
        queryParamsHandling: 'merge'
      });
    } else {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { search: null },
        queryParamsHandling: 'merge'
      });
    }
  }

  /**
   * * Updates the filteredUnits array based on the current search query
   * 
   * - Updates the URL with the current search
   * - Removes old local storage items
   * - Saves current filters to local storage
   * - Fetches the units
   */
  filterUnits() {
    // Remove old local storage items
    localStorage.removeItem('selectedFaculty');
    localStorage.removeItem('selectedSemesters');
    localStorage.removeItem('selectedCampuses');
    // Save filters to local storage 
    if (this.selectedFaculty) localStorage.setItem('selectedFaculty', JSON.stringify(this.selectedFaculty));
    if (this.selectedSemesters) localStorage.setItem('selectedSemesters', JSON.stringify(this.selectedSemesters));
    if (this.selectedCampuses) localStorage.setItem('selectedCampuses', JSON.stringify(this.selectedCampuses));
  
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
    localStorage.setItem('rowsPerPage', JSON.stringify(this.rows)); // Save the rows per page to localStorage
    this.fetchPaginatedUnits();
    scrollToTop(); // Scroll to top of page
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


  /** 
   *  ! |======================================================================|
   *  ! | KEYBOARD SHORTCUTS                                                            
   *  ! |======================================================================|
   */

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
        this.overlayPanel.hide();
      }
    }
    // Focuses on sort by dropdown
    if (event.ctrlKey && event.key === 'f') {
      event.preventDefault();
      if (this.sortByDropdown) {
        if (!this.isSortByFocused) {
          this.sortByDropdown.focus();
          this.sortByDropdown.show();
          this.isSortByFocused = true;
        } else {
          this.sortByDropdown.hide();
          this.isSortByFocused = false;
        }
      }
    }
    // Focuses on advanced filtering
    if (event.ctrlKey && event.key === 'o') {
      event.preventDefault();
      if (this.overlayPanel && this.filterButton) {
        this.overlayPanel.toggle(event, this.filterButton.nativeElement);
        this.sortByDropdown.hide();
      }
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
   *  ! |======================================================================|
   *  ! | META TAGS                                                            
   *  ! |======================================================================|
   */

  /**
   * * Update meta tags for SEO
   */
  private updateMetaTags(): void {
    const pageUrl = `${BASE_URL}/list`;
    
    // Basic meta tags
    this.titleService.setTitle(META_UNIT_LIST_TITLE);
    this.meta.updateTag({ name: 'description', content: META_BASIC_DESCRIPTION });
    this.meta.updateTag({ name: 'keywords',  content: META_BASIC_KEYWORDS });

    // Open Graph tags for social sharing
    this.meta.updateTag({ property: 'og:title', content: META_UNIT_LIST_TITLE });
    this.meta.updateTag({ property: 'og:description', content: META_BASIC_OPEN_GRAPH_DESCRIPTION });
    this.meta.updateTag({ property: 'og:url', content: pageUrl });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    
    // Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: META_BASIC_TWITTER_TITLE });
    this.meta.updateTag({ name: 'twitter:description', content: META_BASIC_DESCRIPTION });

    // console.log('Unit List meta tags updated');

    // Canonical URLs
    const canonicalUrl = this.search 
    ? `https://monstar.wired.org.au/list?search=${encodeURIComponent(this.search)}`
    : 'https://monstar.wired.org.au/list';
    
    // Remove previous canonical if it exists
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) { existingCanonical.remove(); }

    // Add new canonical
    const canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    canonicalLink.setAttribute('href', canonicalUrl);
    document.head.appendChild(canonicalLink);
  }
}
