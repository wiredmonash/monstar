import { CommonModule, UpperCasePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { IUnitCardEnum } from 'app/shared/models/v2/enums';
import { PrimeNgSeverity } from 'app/shared/models/v2/types';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { IOffering, IUnit } from '../../models/v2/unit.schema';
import { TruncatePipe } from '../../pipes/truncate.pipe';

@Component({
  selector: 'app-unit-card',
  standalone: true,
  imports: [
    CardModule,
    UpperCasePipe,
    TruncatePipe,
    TooltipModule,
    CommonModule,
    ChipModule,
    TagModule,
  ],
  templateUrl: './unit-card.component.html',
  styleUrls: ['./unit-card.component.scss'],
})
export class UnitCardComponent implements OnInit, AfterViewInit, OnDestroy {
  Math = Math;

  // The approximate height of a single row in the chips rows
  readonly SINGLE_ROW_HEIGHT = 30;

  // Loading state of the card
  loading: boolean = true;

  // This unit's offerings, locations, and teaching periods
  @Input() unit: IUnit | undefined;
  offerings: IOffering[] = [];
  locations: string[] = [];
  teachingPeriods: string[] = [];
  // Chips container references for checking overflow
  @ViewChild('locationsRow') locationsRow!: ElementRef;
  @ViewChild('periodsRow') periodsRow!: ElementRef;

  // Overflow bools for locations and periods
  locationChipsOverflow = false;
  periodChipsOverflow = false;

  // Visible locations and periods
  visibleLocations: string[] = [];
  visiblePeriods: string[] = [];

  // Teaching periods
  private reversePeriodsMap: Record<string, string> = {};
  private periodNames: Record<string, string> = {
    // Regular semesters
    'First semester': 'Sem 1',
    'Second semester': 'Sem 2',
    'First semester (extended)': 'Sem 1 Ext',
    'Second semester (extended)': 'Sem 2 Ext',
    'First semester - alternate': 'Sem 1 Alt',
    'Second semester - alternate': 'Sem 2 Alt',
    'First semester (Northern)': 'Sem 1 North',
    'Second semester (Northern)': 'Sem 2 North',

    // Summer/Winter
    'Summer semester A': 'Summer A',
    'Summer semester B': 'Summer B',
    'Summer semester A - alternate': 'Summer A Alt',
    'Summer semester B - alternate': 'Summer B Alt',
    'Winter semester': 'Winter',
    'Winter semester - alternate': 'Winter Alt',

    // Terms/Trimesters
    'Term 1': 'Term 1',
    'Term 2': 'Term 2',
    'Term 4': 'Term 4',
    'Trimester 1': 'Tri 1',
    'Trimester 2': 'Tri 2',
    'Trimester 3': 'Tri 3',

    // Teaching periods
    'Teaching period 2': 'TP 2',
    'Teaching period 3': 'TP 3',
    'Teaching period 4': 'TP 4',
    'Teaching period 5': 'TP 5',
    'Teaching period 6': 'TP 6',

    // MBA
    'MBA teaching period 1': 'MBA 1',
    'MBA teaching period 2': 'MBA 2',

    // Research
    'Research quarter 1': 'RQ 1',
    'Research quarter 2': 'RQ 2',

    // Monash Indonesia
    'Monash Indonesia term 1': 'MI Term 1',
    'Monash Indonesia term 2': 'MI Term 2',
    'Monash Indonesia term 3': 'MI Term 3',
    'Monash Indonesia term 4': 'MI Term 4',

    // Full year
    'Full year': 'Full Year',
    'Full year extended': 'Full Year Ext',

    // Combined periods
    'Summer semester A to First semester': 'Summer A-Sem 1',
    'Second semester to Summer semester A': 'Sem 2-Summer A',
    'Second semester to First semester': 'Sem 2-Sem 1',

    // Special cases
    'October intake teaching period, Malaysia campus': 'Oct MY',
  };
  private periodOrderMap: Map<string, number>;
  private shortNameCache: Map<string, string>;

  // Memoized original period names for performance
  private memoizedOriginalPeriodNames = new Map<string, string[]>();

  tagMapping: Record<
    IUnitCardEnum,
    { name: string; severity: PrimeNgSeverity; icon: string }
  > = {
    'most-reviews': { name: 'Popular', severity: 'info', icon: 'pi pi-star' },
    controversial: {
      name: 'Controversial',
      severity: 'danger',
      icon: 'pi pi-exclamation-triangle',
    },
    'wam-booster': {
      name: 'WAM Boost',
      severity: 'success',
      icon: 'pi pi-angle-double-up',
    },
  };

  constructor(private router: Router) {
    // Initalise period order map
    this.periodOrderMap = new Map(
      Object.values(this.periodNames).map((name, index) => [name, index])
    );

    // Precompute shortened names
    this.shortNameCache = new Map(
      Object.entries(this.periodNames).map(([original, short]) => [
        original,
        short,
      ])
    );
  }

  /* ---------------------------- Life cycle hooks ---------------------------- */

  async ngOnInit(): Promise<void> {
    await this.processUnitData();
  }

  ngAfterViewInit(): void {
    // Wait for the view to render before checking for overflow
    requestAnimationFrame(() => {
      this.checkOverflow();
    });
  }

  ngOnDestroy(): void {
    this.memoizedOriginalPeriodNames.clear();
  }

  /* -------------------------- Unit data processing -------------------------- */

  /**
   * * Process Unit Data
   *
   * Processes the unit data to extract the offerings, locations, and teaching
   * periods.
   *
   * Also creates a reverse mapping for the period names mapping.
   *
   * Time Complexity: O(n + mlog(m) + klog(k) + p) where
   * - n = number of offerings
   * - m = number of unique periods
   * - k = number of unique locations
   * - p = size of periodNames object
   *
   * @async
   * @private
   * @returns {Promise<void>} A promise that resolves when the data has been processed.
   */
  private async processUnitData(): Promise<void> {
    // Check if the unit has offerings
    if (!this.unit?.offerings || this.unit.offerings.length === 0) {
      this.teachingPeriods = ['No Offerings in 2025'];
      this.locations = [];
      return;
    }

    // If the unit has offerings get them
    this.offerings = this.unit!.offerings;

    // & Get the teaching periods of the offerings (no duplicates)
    this.teachingPeriods = [
      ...new Set(this.offerings.map((offering) => offering.period)),
    ]
      // Use cache lookup to get shortened names for better performance
      .map((period) => this.shortNameCache.get(period) || period)
      // Sort by length first, then by order in periodNames
      .sort((a, b) => {
        // First sort by length
        const lengthDiff = a.length - b.length;
        if (lengthDiff !== 0) return lengthDiff;

        // Use period order map to sort by order in periodNames
        const indexA = this.periodOrderMap.get(a) ?? Infinity;
        const indexB = this.periodOrderMap.get(b) ?? Infinity;
        return indexA - indexB;
      });

    // & Get the locations of the offerings (no duplicates)
    this.locations = [
      ...new Set(this.offerings.map((offering) => offering.location)),
    ]
      // Sort by length first, then alphabetically
      .sort((a, b) => {
        const lengthDiff = a.length - b.length;
        return lengthDiff !== 0 ? lengthDiff : a.localeCompare(b);
      });

    // & Create reverse mappings for period names
    this.reversePeriodsMap = Object.entries(this.periodNames).reduce(
      (acc, [original, short]) => ({
        ...acc,
        [short]: original,
      }),
      {}
    );
  }

  /* -------------- Teaching periods and locations helper methods ------------- */

  /**
   * Get original teaching period name given short name
   */
  getOriginalPeriodName(shortName: string): string {
    return this.getMemoizedOriginalPeriodNames([shortName])[0];
  }

  /**
   * Get Period Names Tooltip
   *
   * Gets the tooltip for the teaching periods with the original long names.
   *
   * @returns {String} The tooltip for the teaching periods.
   */
  getPeriodNamesTooltip(): string {
    const hiddenPeriods = this.teachingPeriods.filter(
      (p) => !this.visiblePeriods.includes(p)
    );
    return this.getMemoizedOriginalPeriodNames(hiddenPeriods).join('\n');
  }

  /**
   * Get Original Teaching Periods Names with Memoization
   *
   * Gets the original teaching period names with caching for better performance.
   *
   * @param {string[]} shortNames The list of shortened names of the teaching periods
   * @returns {string[]} The list of original names of the teaching periods
   */
  private getMemoizedOriginalPeriodNames(shortNames: string[]): string[] {
    // Create a key from teh sorted short anmes to ensure consistent caching
    const key = shortNames.sort().join('|');

    if (!this.memoizedOriginalPeriodNames.has(key)) {
      this.memoizedOriginalPeriodNames.set(
        key,
        shortNames.map((short) => this.reversePeriodsMap[short] || short)
      );
    }

    return this.memoizedOriginalPeriodNames.get(key)!;
  }

  /**
   * Check Overflow
   *
   * Checks if the locations and periods rows are overflowing and sets the
   * visible locations and periods accordingly.
   */
  private checkOverflow(): void {
    // Check locations row
    const locationsRowHeight = this.locationsRow.nativeElement.offsetHeight;
    if (locationsRowHeight > this.SINGLE_ROW_HEIGHT) {
      // Only show the shortest location name
      this.visibleLocations = [this.locations[0]];

      this.locationChipsOverflow = true;
    }

    // Check periods row
    const periodsRowHeight = this.periodsRow.nativeElement.offsetHeight;
    if (periodsRowHeight > this.SINGLE_ROW_HEIGHT) {
      // Only show the first two periods
      this.visiblePeriods = this.teachingPeriods.slice(0, 2);

      this.periodChipsOverflow = true;
    }
  }

  /* -------------------------- Basic helper methods -------------------------- */

  // Navigates to the unit overview page for the selected unit.
  onCardClick(): void {
    this.router.navigate(['/unit', this.unit?.unitCode]);
  }

  // Returns the string to display for the number of reviews.
  getReviewsText(): string {
    return this.unit!.reviews.length > 1
      ? this.unit!.reviews.length + ' reviews'
      : this.unit!.reviews.length > 0
        ? '1 review'
        : 'No reviews';
  }
}
