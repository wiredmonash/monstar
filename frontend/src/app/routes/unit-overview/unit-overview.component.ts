import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../api.service';
import { ReviewCardComponent } from "../../shared/components/review-card/review-card.component";
import { UnitReviewHeaderComponent } from "../../shared/components/unit-review-header/unit-review-header.component";
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-unit-overview',
  standalone: true,
  imports: [
    ReviewCardComponent, 
    UnitReviewHeaderComponent
  ],
  templateUrl: './unit-overview.component.html',
  styleUrl: './unit-overview.component.scss'
})
export class UnitOverviewComponent implements OnInit {
  // This will store the unit that we are currently showing
  unit: any = null;

  // Stores the reviews
  reviews: any[] = [];


  // Injects ApiService and ActivatedRoute
  constructor (
    private apiService: ApiService,
    private route: ActivatedRoute,
  ) { }


  /** 
   * * Runs on initialisation
   * 
   * Gets the unitcode from the URL param and uses it to get the unit and reviews.
   */ 
  ngOnInit(): void {
    // Get unit code from the route parameters
    const unitCode = this.route.snapshot.paramMap.get('unitcode');

    if (unitCode) {
      this.getUnitByUnitcode(unitCode); // Get the unit
      this.getAllReviews(unitCode); // Get the reviews
    }
  }


  /**
   * * Fetches all reviews from the API and stores them in the component.
   *
   * This method calls the API to retrieve all the reviews and stores the fetched reviews in the `reviews` property.
   * It also logs the response to the console for debugging purposes.
   */
  getAllReviews(unitCode?: any) {
    this.apiService.getAllReviewsGET(unitCode).subscribe(
      (reviews: any) => {
        // Store the fetched reviews 
        this.reviews = reviews;

        // Update the reviews property in the unit object
        if (this.unit)
          this.unit.reviews = this.reviews;

        // ? Debug log: Success
        console.log('GET Get All Reviews', reviews);
      },
      (error: any) => {
        // ? Debug log: Error
        console.log('ERROR DURING: GET Get All Reviews', error)
      }
    );
  }

  /**
   * * Fetches the unit by its unit code and stores it in the component.
   *
   * This method calls the API to retrieve the unit details for a specific unit code ('fit1045'),
   * and stores the resulting unit data in the `unit` property.
   * 
   * Logs the success or error response to the console.
   */
  getUnitByUnitcode(unit: string) {
    this.apiService.getUnitByUnitcodeGET(unit).subscribe(
      (unit: any) => {
        // Store the unit
        this.unit = unit;

        // ? Debug log: Success
        console.log('GET Get Unit by Unitcode', unit);
      },
      (error: any) => {
        // ? Debug log: Error
        console.log('ERROR DURING: GET Get Unit by Unitcode');
      }
    );
  }


  /**
   * * Sorts the reviews array based on the specified criteria
   * 
   * @param {string} criteria - The criteria to sort the reviews by.
   * 
   * Criteria options
   * - 'recent': Sorts the reviews by most recent first based on `createdAt` property.
   * - 'lowest-rating': Sorts the reviews by the lowest rating (`overallRating`) first.
   * - 'highest-rating': Sorts the reviews by the highest rating (`overallRating`) first.
   */
  sortReviews(criteria: string) {
    // ? Debug log: Sorting reviews message
    console.log('Sorting reviews', criteria);

    // Criterion
    switch (criteria) {
      // Sorting by most recent
      case 'recent':
        this.reviews.sort((a,b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime(); // Most recent first
        });
        break;

      // Sorting by lowest rating
      case 'lowest-rating':
        this.reviews.sort((a, b) => a.overallRating - b.overallRating);
        break;

      // Sorting by highest rating
      case 'highest-rating':
        this.reviews.sort((a, b) => b.overallRating - a.overallRating);
        break;
    }
  }

  /**
   * This method is called finally after a few event emittors going from:
   * write-review-unit (emits reviewPosted) -> unit-review-header (emits reviewAdded) -> unit-overview
   */
  refreshReviews() {
    if (this.unit && this.unit.unitCode) {
      this.getAllReviews(this.unit.unitCode);     // Get all the reviews again. 
      this.getUnitByUnitcode(this.unit.unitCode); // Get the unit again for updated avg ratings.
    }
  }
}
