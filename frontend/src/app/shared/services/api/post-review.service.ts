import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ICreateReview, IReview } from 'app/shared/models/v2/review.schema';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PostReviewService {
  private url = environment.apiV2Url;
  private http = inject(HttpClient);

  createReview(unitCode: string, review: ICreateReview): Observable<IReview> {
    return this.http.post<IReview>(
      `${this.url}/reviews/${unitCode}/create`,
      {
        title: review.title,
        semester: review.semester,
        ...(review.grade ? { grade: review.grade } : {}),
        year: review.year,
        overallRating: review.overallRating,
        relevancyRating: review.relevancyRating,
        facultyRating: review.facultyRating,
        contentRating: review.contentRating,
        description: review.description,
        author: review.author,
      },
      { withCredentials: true }
    );
  }
}
