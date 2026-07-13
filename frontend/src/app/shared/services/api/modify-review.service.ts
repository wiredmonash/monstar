import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IReview, IUpdateReview } from 'app/shared/models/v2/review.schema';
import { environment } from 'environments/environment';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModifyReviewService {
  private url = environment.apiV2Url;
  private http = inject(HttpClient);

  toggleReaction(
    reviewId: string,
    userId: string,
    reactionType: 'like' | 'dislike'
  ): Observable<IReview> {
    return this.http
      .patch<{
        review: IReview;
        reactions: object;
      }>(
        `${this.url}/reviews/toggle-reaction/${reviewId}`,
        { userId, reactionType },
        { withCredentials: true }
      )
      .pipe(map((response) => response.review));
  }

  editReview(review: IUpdateReview) {
    return this.http.put(
      `${this.url}/reviews/update/${review._id}`,
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
      },
      { withCredentials: true }
    );
  }
}
