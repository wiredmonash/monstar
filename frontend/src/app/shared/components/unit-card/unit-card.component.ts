import { AfterViewInit, asNativeElements, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';
import { RatingModule } from 'primeng/rating';
import { ButtonModule } from 'primeng/button';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TruncatePipe } from "../../pipes/truncate.pipe";
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';
import { Unit } from '../../models/unit.model';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-unit-card',
  standalone: true,
  imports: [
    CardModule,
    FormsModule,
    RatingModule,
    ButtonModule,
    UpperCasePipe,
    TruncatePipe,
    TooltipModule,
    CommonModule,
    ChipModule,
    SkeletonModule
],
  templateUrl: './unit-card.component.html',
  styleUrls: ['./unit-card.component.scss']
})
export class UnitCardComponent implements OnInit, AfterViewInit {
  // Provide Math to the template
  Math = Math;

  // Chips container references for checking overflow
  @ViewChild('locationsRow') locationsRow!: ElementRef;
  @ViewChild('periodsRow') periodsRow!: ElementRef;

  // The approximate height of a single row in the chips rows
  readonly SINGLE_ROW_HEIGHT = 30;

  // Input unit to display parent component
  @Input() unit: Unit | undefined;

  loading: boolean = true;

  offerings: any[] = [];
  locations: any[] = [];
  teachingPeriods: any[] = [];

  locationChipsOverflow = false;
  periodChipsOverflow = false;
  visibleLocations: string[] = [];
  visiblePeriods: string[] = [];

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
    'October intake teaching period, Malaysia campus': 'Oct MY'
  };


  /**
   * === Constructor ===
   * 
   * @param {Router} router The router service to navigate to the unit overview page.
   */
  constructor(private router: Router) { }

  /**
   * * Runs on Component Initialisation
   * 
   * Calls the processUnitData method to extract needed data from the unit object.
   * If the unit has no offerings, sets the teaching periods to ['No Offerings in 2025']
   * 
   * @async
   * @returns {Promise<void>} A promise that resolves when the component initialisation is complete.
   */
  async ngOnInit(): Promise<void> {
    if (this.unit?.offerings) {
      await this.processUnitData();
    } else {
      this.teachingPeriods = ['No Offerings in 2025'];
    }
  }

  /**
   * * After View Initialisation
   * 
   * Waits for the view to render before checking for overflow in the locations and periods rows.
   */
  ngAfterViewInit(): void {
    // Wait for the view to render before checking for overflow
    requestAnimationFrame(() => {
      this.checkOverflow();
    });
  }

  /**
   * * Process Unit Data
   * 
   * Processes the unit data to extract the offerings, locations, and teaching 
   * periods. 
   * 
   * Also creates a reverse mapping for the period names mapping.
   * 
   * @async
   * @private
   * @returns {Promise<void>} A promise that resolves when the data has been processed.
   */
  private async processUnitData(): Promise<void> {
    // If the unit has offerings get them
    this.offerings = this.unit!.offerings;

    // * Get the teaching periods of the offerings
    this.teachingPeriods = [...new Set(this.offerings.map(offering => offering.period))];

    // Map to shortened names using periodNames
    this.teachingPeriods = this.teachingPeriods.map(
      period => this.periodNames[period as keyof typeof this.periodNames] || period
    );

    // Sort based on order in periodNames
    const periodOrder = Object.values(this.periodNames);
    this.teachingPeriods.sort((a: any, b: any) => {
      const indexA = periodOrder.indexOf(a);
      const indexB = periodOrder.indexOf(b);

      // Handle cases where period isn't in period names
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });

    // * Get the locations of the offerings (no duplicates)
    this.locations = [...new Set(this.offerings.map(offering => offering.location))];

    // Sort the locations alphabetically and numerically
    this.locations.sort((a, b) => a.localeCompare(b));

    // Create reverse mappings for period names
    this.reversePeriodsMap = Object.entries(this.periodNames)
      .reduce((acc, [original, short]) => ({
        ...acc,
        [short]: original
      }), {});
  }

  /**
   * * Check Overflow
   * 
   * Checks if the locations and periods rows are overflowing and sets the 
   * visible locations and periods accordingly.
   */
  private checkOverflow(): void {
    // Check locations row
    const locationsRowHeight = this.locationsRow.nativeElement.offsetHeight;
    if (locationsRowHeight > this.SINGLE_ROW_HEIGHT) {
      this.locationChipsOverflow = true;
      this.visibleLocations = this.locations.slice(0,2); // Show first two locations
    }

    // Check periods row
    const periodsRowHeight = this.periodsRow.nativeElement.offsetHeight;
    if (periodsRowHeight > this.SINGLE_ROW_HEIGHT) {
      this.periodChipsOverflow = true;
      this.visiblePeriods = this.teachingPeriods.slice(0,2); // Show first two periods
    }
  }

  /**
   * * Get Original Teaching Period Name
   * 
   * Gets the original teaching period name given the shortened name.
   * 
   * @param {string} shortName The shortened name of the teaching period.
   * @returns {string} The original name of the teaching period.
   */
  getOriginalPeriodName(shortName: string): string {
    return this.reversePeriodsMap[shortName] || shortName;
  }

  /**
   * * Get Original Teaching Period Names
   * 
   * Gets the original teaching period names given a list of shortened names.
   * 
   * @param {string[]} shortNames The list of shortened names of the teaching periods.
   * @returns {string[]} The list of original names of the teaching periods.
   */
  getOriginalPeriodNames(shortNames: string[]): string[] {
    return shortNames
      .map(short => this.reversePeriodsMap[short] || short)
  }

  // Navigates to the unit overview page for the selected unit.
  onCardClick() {
    this.router.navigate(['/unit-overview', this.unit?.unitCode]);
  }

  getReviewsText() {
    return this.unit!.reviews.length > 1 
    ? this.unit!.reviews.length + ' reviews' 
    : this.unit!.reviews.length > 0 ? '1 review' : 'No reviews'
  }
}