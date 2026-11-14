import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UnitCardComponent } from '@components/unit-card/unit-card.component';
import { GetUnitService } from '@services/api/get-unit.service';
import { SeoService } from '@services/seo.service';
import { ViewportService } from '@services/viewport.service';
import { CAMPUSES, FACULTIES, SEMESTERS } from 'app/shared/models/v2/enums';
import { IUnit } from 'app/shared/models/v2/unit.schema';
import { ButtonModule } from 'primeng/button';
import { Dropdown, DropdownModule } from 'primeng/dropdown';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ScrollTopModule } from 'primeng/scrolltop';
import { SkeletonModule } from 'primeng/skeleton';
import { SplitButtonModule } from 'primeng/splitbutton';
import { ToolbarModule } from 'primeng/toolbar';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  BASE_URL,
  META_BASIC_DESCRIPTION,
  META_BASIC_KEYWORDS,
  META_BASIC_OPEN_GRAPH_DESCRIPTION,
  META_BASIC_TWITTER_TITLE,
  META_UNIT_LIST_TITLE,
} from '../../shared/constants/constants';
import { SORT_OPTIONS_LIST } from '../../shared/constants/sort-options';
import {
  FilterData,
  FilteredUnitsResponse,
} from '../../shared/models/v2/unit.model';

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
  filteredUnits: IUnit[] = [];
  totalRecords: number = 0;

  // Loading state of unit cards
  loading: boolean = true;

  @ViewChild('sortByDropdown') sortByDropdown!: Dropdown;
  isSortByFocused: boolean = false;
  isSearchFocused: boolean = false;

  // Sort options list for dropdown
  sortOptions = SORT_OPTIONS_LIST;

  @ViewChild('op') overlayPanel!: OverlayPanel;
  @ViewChild('filterButton', { read: ElementRef }) filterButton!: ElementRef;

  allFaculties: string[] = [...FACULTIES];
  allSemesters: string[] = [...SEMESTERS];
  allCampuses: string[] = [...CAMPUSES];

  get viewportType() {
    return this.viewportService.type();
  }

  // Debouncing search
  private $$debounchedSearch = new Subject<string>();

  filterData: FilterData = {
    offset: 0,
    limit: 24,
    search: '',
    sort: 'Most Reviews',
    showReviewed: false,
    showUnreviewed: false,
    hideNoOfferings: false,
    selectedFaculties: [],
    selectedSemesters: [],
    selectedCampuses: [],
  };

  constructor(
    private unitService: GetUnitService,
    private seo: SeoService,
    private viewportService: ViewportService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  /* ----------------------------- Lifecycle hooks ---------------------------- */

  ngOnInit(): void {
    this.updateMetaTags();

    // Setup debounced search
    this.$$debounchedSearch
      .pipe(
        debounceTime(400), // Wait 400ms after the user stops typing
        distinctUntilChanged() // Only emit if the search string changed
      )
      .subscribe((searchTerm) => {
        this.updateSearchQueryParams(searchTerm);
        this.filterUnits();
      });

    // Subscribe to route parameter changes
    this.route.queryParams.subscribe((params) => {
      if (params['search']) {
        if (this.filterData.search !== params['search']) {
          this.filterData.search = params['search'];
          this.fetchPaginatedUnits();
        }
      } else if (this.filterData.search) {
        this.filterData.search = '';
      }
    });

    // Retrieve the sortBy state from local storage
    const savedSortBy = localStorage.getItem('sortBy');
    if (savedSortBy) this.filterData.sort = savedSortBy;

    // Retrieve the rows per page state from local storage
    const savedRowsPerPage = localStorage.getItem('rowsPerPage');
    if (savedRowsPerPage) this.filterData.limit = JSON.parse(savedRowsPerPage);

    // Retrieve the selected faculty from local storage
    const savedFaculty = localStorage.getItem('selectedFaculty');
    if (savedFaculty)
      this.filterData.selectedFaculties = JSON.parse(savedFaculty);

    // Retrieve the selected semesters from local storage
    const savedSemesters = localStorage.getItem('selectedSemesters');
    if (savedSemesters)
      this.filterData.selectedSemesters = JSON.parse(savedSemesters);

    // Retrieve the selected campuses from local storage
    const savedCampuses = localStorage.getItem('selectedCampuses');
    if (savedCampuses)
      this.filterData.selectedCampuses = JSON.parse(savedCampuses);

    // Fetches the paginated units from the backend
    this.fetchPaginatedUnits();
  }

  ngOnDestroy(): void {
    this.seo.clear();

    // Unsubscribe from the debounced search
    this.$$debounchedSearch.complete();
  }

  /* --------------------- Paginations and units retrieval -------------------- */

  fetchPaginatedUnits() {
    this.loading = true;

    this.unitService.getUnitsFiltered(this.filterData).subscribe({
      next: (response: FilteredUnitsResponse) => {
        this.filteredUnits = response.units;
        this.totalRecords = response.total;
        this.loading = false;
      },
      error: (error) => {
        if (error.statusCode == 404) {
          this.filteredUnits = [];
          this.totalRecords = 0;
        }
        this.loading = false;
      },
    });
  }

  onSearchInput() {
    this.$$debounchedSearch.next(this.filterData.search);
  }

  updateSearchQueryParams(searchTerm: string) {
    if (searchTerm) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { search: searchTerm },
        queryParamsHandling: 'merge',
      });
    } else {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { search: null },
        queryParamsHandling: 'merge',
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
    if (this.filterData.selectedFaculties)
      localStorage.setItem(
        'selectedFaculty',
        JSON.stringify(this.filterData.selectedFaculties)
      );
    if (this.filterData.selectedSemesters)
      localStorage.setItem(
        'selectedSemesters',
        JSON.stringify(this.filterData.selectedSemesters)
      );
    if (this.filterData.selectedCampuses)
      localStorage.setItem(
        'selectedCampuses',
        JSON.stringify(this.filterData.selectedCampuses)
      );

    this.filterData.offset = 0;
    this.fetchPaginatedUnits();
  }

  /**
   * Handle paginator page change.
   */
  onPageChange(event: PaginatorState) {
    this.filterData.offset = event.first ?? 0;
    if (event.rows) this.filterData.limit = event.rows;
    localStorage.setItem('rowsPerPage', JSON.stringify(this.filterData.limit));
    this.fetchPaginatedUnits();
  }

  /**
   * Save the sortBy dropdown option
   */
  onSortByChange() {
    localStorage.setItem('sortBy', this.filterData.sort);
    this.fetchPaginatedUnits(); // Refetch units
  }

  /* --------------------------- Keyboard shortcuts --------------------------- */

  /**
   * Handles focusing via keybinds
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
    const searchInput = document.getElementById(
      'searchInput'
    ) as HTMLInputElement;

    // Focuses on search bar
    if (event.ctrlKey && event.key === 'k') {
      event.preventDefault();
      if (searchInput) {
        searchInput.focus();
        this.sortByDropdown.hide();
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
      if (activeElement) activeElement.blur();
    }
    if (event.key == 'Enter') {
      if (this.isSearchFocused && this.filterData.search) {
        this.filterUnits();
      }
    }
  }

  /* ---------------------------- SEO meta tagging ---------------------------- */

  private updateMetaTags(): void {
    const pageUrl = `${BASE_URL}/list`;

    this.seo.set(
      META_UNIT_LIST_TITLE,
      {
        description: META_BASIC_DESCRIPTION,
        keywords: META_BASIC_KEYWORDS,
        'og:title': META_UNIT_LIST_TITLE,
        'og:description': META_BASIC_OPEN_GRAPH_DESCRIPTION,
        'og:url': pageUrl,
        'og:type': 'website',
        'twitter:card': 'summary',
        'twitter:title': META_BASIC_TWITTER_TITLE,
        'twitter:description': META_BASIC_DESCRIPTION,
      },
      this.filterData.search
        ? `${pageUrl}?search=${encodeURIComponent(this.filterData.search)}`
        : pageUrl
    );
  }
}
