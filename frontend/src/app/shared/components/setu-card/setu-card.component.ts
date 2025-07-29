import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';

// PrimeNG modules
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { SplitButtonModule } from 'primeng/splitbutton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';

// App specific services and models
import { SetuService } from '../../services/setu.service';
import { Setu } from '../../models/setu.model';

@Component({
  selector: 'app-setu-card',
  standalone: true,
  imports: [
    CommonModule,
    AccordionModule,
    ButtonModule,
    ProgressBarModule,
    SplitButtonModule,
    ProgressSpinnerModule,
    TooltipModule
  ],
  templateUrl: './setu-card.component.html',
  styleUrl: './setu-card.component.scss'
})
export class SetuCardComponent implements OnChanges {
  @Input() unitCode: string | null = null;

  loading = true;
  error: string | null = null;
  setuData: Setu[] = [];
  selectedSetu: Setu | null = null;

  headerTooltip: string | undefined = undefined;

  semesterMenuItems: MenuItem[] = [];

  constructor(private setuService: SetuService) { }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-fetch data if the unit code changes
    if (changes['unitCode'] && this.unitCode) {
      this.loadSetuData();
    }
  }

  /**
   * Fetches all SETU data for the given unit code.
   */
  loadSetuData(): void {
    if (!this.unitCode) return;

    this.loading = true;
    this.error = null;
    this.headerTooltip = undefined;  // Reset tooltip on new load

    this.setuService.getSetuByUnitCode(this.unitCode).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.setuData = data;
          this.selectSetu(data[0]); // Select the most recent one by default
          this.headerTooltip = undefined;  // No tooltip needed if data exists
        } else {
          this.setuData = [];
          this.selectedSetu = null;
          // SET TOOLTIP for no data case
          this.headerTooltip = 'No SETU data available for this unit.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Could not load SETU data.';
        this.headerTooltip = 'No SETU data available for this unit.';
        console.error('Error loading SETU data for card:', err);
        this.loading = false;
      }
    });
  }

  /**
   * Updates the selected SETU and rebuilds the semester selection menu.
   * @param setu The SETU object to display.
   */
  selectSetu(setu: Setu): void {
    this.selectedSetu = setu;
    this.buildSemesterMenu();
  }

  /**
   * Creates the dropdown menu items for other available SETU seasons.
   */
  buildSemesterMenu(): void {
    if (this.setuData.length <= 1) {
      this.semesterMenuItems = [];
      return;
    }
    this.semesterMenuItems = this.setuData
      .filter(s => s._id !== this.selectedSetu?._id)
      .map(s => ({
        label: this.getSeasonDisplay(s.Season),
        command: () => this.selectSetu(s)
      }));
  }

  /**
   * Formats a season string (e.g., "2024_S1") for display.
   * @param season The raw season string from the data.
   * @returns A user-friendly season string (e.g., "Semester 1 - 2024").
   */
  getSeasonDisplay(season: string): string {
    const seasonMap: { [key: string]: string } = {
      S1: 'Semester 1',
      S2: 'Semester 2',
      SS: 'Summer School',
      WS: 'Winter School',
    };

    const parts = season.split('_');
    if (parts.length === 2) {
      const year = parts[0];
      const sem = parts[1];
      return `${seasonMap[sem] || sem} - ${year}`;
    }
    return season;
  }

  /**
   * Calculates the response rate as a whole number percentage.
   * @param setu The selected SETU object.
   */
  getResponseRatePercent(setu: Setu): number {
    if (setu.Invited === 0) return 0;
    return Math.round((setu.Responses / setu.Invited) * 100);
  }

  /**
   * Converts a score out of 5 to a percentage for the progress bar.
   * @param score The score to convert (0-5).
   */
  getScoreAsPercentage(score: number): number {
    if (!score || score <= 0) return 0;
    return (score / 5) * 100;
  }

  /**
   * Navigates to the full SETU overview page in a new tab.
   */
  goToSetuOverview(event: MouseEvent): void {
    event.stopPropagation(); // Prevent accordion from toggling
    if (this.unitCode) {
      window.open(`/setu/${this.unitCode.toLowerCase()}`, '_blank');
    }
  }
}