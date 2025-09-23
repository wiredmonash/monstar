import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG modules
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';

// App specific models
import { AiOverview } from '../../models/ai-overview.model';

@Component({
  selector: 'app-ai-overview',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TooltipModule
  ],
  templateUrl: './ai-overview.component.html',
  styleUrl: './ai-overview.component.scss'
})
export class AiOverviewComponent {
  @Input() unit: any = null;

  /**
   * * Gets AI overview from unit data
   */
  get aiOverview(): AiOverview | null {
    return this.unit?.aiOverview || null;
  }

  /**
   * * Formats the generated date for display
   */
  getFormattedDate(): string {
    if (!this.aiOverview?.generatedAt) return '';

    const date = new Date(this.aiOverview.generatedAt);
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
