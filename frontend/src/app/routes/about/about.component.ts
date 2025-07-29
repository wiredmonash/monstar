import { Component, OnInit } from '@angular/core';
import {
  GitHubService,
  GitHubContributor,
} from '../../shared/services/github.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent implements OnInit {
  contributors: GitHubContributor[] = [];
  loading: boolean = false;
  error: string = '';
  hasAuth: boolean = false;
  totalContributions: number = 0;

  constructor(private githubService: GitHubService) {}

  ngOnInit(): void {
    this.hasAuth = this.githubService.hasAuthentication();
    this.loadContributors();
  }

  loadContributors(): void {
    this.loading = true;
    this.error = '';

    this.githubService.getMonstarContributors().subscribe({
      next: (contributors) => {
        this.contributors = contributors;
        this.calculateTotalContributions();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading contributors:', error);
        this.error = 'Failed to load contributor data. Please try again later.';
        this.loading = false;
      },
    });
  }

  calculateTotalContributions(): void {
    this.totalContributions = this.contributors.reduce((total, contributor) => {
      return total + contributor.contributions;
    }, 0);
  }

  getContributionPercentage(contributions: number): number {
    if (this.totalContributions === 0) return 0;
    return (contributions / this.totalContributions) * 100;
  }

  getProgressBarColor(percentage: number): string {
    if (percentage >= 40) return '#28a745'; // Green for high contributors
    if (percentage >= 20) return '#17a2b8'; // Blue for medium contributors
    if (percentage >= 10) return '#ffc107'; // Yellow for low-medium contributors
    return '#6c757d'; // Gray for low contributors
  }

  trackByUsername(index: number, contributor: GitHubContributor): string {
    return contributor.username;
  }
}
