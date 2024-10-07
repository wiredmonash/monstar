import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../api.service';
import { ReviewCardComponent } from "../../shared/components/review-card/review-card.component";
import { UnitReviewHeaderComponent } from "../../shared/components/unit-review-header/unit-review-header.component";

@Component({
  selector: 'app-unit-overview',
  standalone: true,
  imports: [ReviewCardComponent, UnitReviewHeaderComponent],
  templateUrl: './unit-overview.component.html',
  styleUrl: './unit-overview.component.css'
})
export class UnitOverviewComponent implements OnInit {
  // TODO: This will store the unit that we are currently showing 
  unit = null;

  // Stores the reviews
  reviews: any[] = [];

  constructor (private apiService: ApiService) { }

  ngOnInit(): void {
    this.getAllReviews();
  }

  getAllReviews() {
    this.apiService.getAllReviewsGET().subscribe(
      (reviews: any) => {
        // Store the fetched reviews 
        this.reviews = reviews;

        // ? Debug log: Success
        console.log('GET Get All Reviews', reviews);
      },
      (error: any) => {
        // ? Debug log: Error
        console.log('ERROR DURING: GET Get All Reviews', error)
      }
    );
  }
}
