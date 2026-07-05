import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  ChangelogData,
  ChangelogEntry,
  ChangelogYear,
} from '../../shared/models/changelog';

@Component({
  selector: 'app-changelog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './changelog.component.html',
  styleUrl: './changelog.component.scss',
})
export class ChangelogComponent implements OnInit {
  changelogData: ChangelogData | null = null;
  loading: boolean = false;
  error: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadChangelog();
  }

  loadChangelog(): void {
    this.loading = true;
    this.error = '';
    this.http.get<ChangelogData>('changelog.json').subscribe({
      next: (data) => {
        this.changelogData = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load changelog. Please try again.';
        this.loading = false;
      },
    });
  }

  getMonthName(monthNum: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[monthNum - 1];
  }

  getMonthHeader(entry: ChangelogEntry, year: number): string {
    if (entry.monthStart && entry.monthEnd) {
      return `${this.getMonthName(entry.monthStart)} – ${this.getMonthName(entry.monthEnd)} ${year}`;
    } else if (entry.month) {
      return `${this.getMonthName(entry.month)} ${year}`;
    }
    return '';
  }

  isCategorized(content: any): boolean {
    return !Array.isArray(content);
  }

  getCategories(content: any): string[] {
    return Object.keys(content);
  }

  getItems(content: any, category?: string): string[] {
    if (category) {
      return content[category];
    }
    return content;
  }

  trackByYear(index: number, year: ChangelogYear): number {
    return year.year;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
