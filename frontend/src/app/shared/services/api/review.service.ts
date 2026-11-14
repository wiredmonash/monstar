import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  ICreateReview,
  IReview,
  IReviewFullyPopulated,
  IUpdateReview,
} from 'app/shared/models/v2/review.schema';
import { environment } from 'environments/environment';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private url = `${environment.apiV2Url}/reviews`;
  private http = inject(HttpClient);

  getMostLiked(n: number = 10): Observable<Array<IReviewFullyPopulated>> {
    const params = new HttpParams().set('n', n.toString());
    return this.http.get<Array<IReviewFullyPopulated>>(`${this.url}/popular`, {
      params,
    });
  }

  getReviewsByUser(userId: string): Observable<Array<IReviewFullyPopulated>> {
    return this.http.get<Array<IReviewFullyPopulated>>(
      `${this.url}/user/${userId}`
    );
  }

  createReview(unitCode: string, review: ICreateReview): Observable<IReview> {
    return this.http.post<IReview>(
      `${this.url}/${unitCode}/create`,
      { ...this.editableFields(review), author: review.author },
      { withCredentials: true }
    );
  }

  editReview(review: IUpdateReview) {
    return this.http.put(
      `${this.url}/update/${review._id}`,
      this.editableFields(review),
      { withCredentials: true }
    );
  }

  deleteById(id: string) {
    return this.http.delete(`${this.url}/delete/${id}`, {
      withCredentials: true,
    });
  }

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
        `${this.url}/toggle-reaction/${reviewId}`,
        { userId, reactionType },
        { withCredentials: true }
      )
      .pipe(map((response) => response.review));
  }

  private editableFields(review: ICreateReview) {
    return {
      title: review.title,
      semester: review.semester,
      ...(review.grade ? { grade: review.grade } : {}),
      year: review.year,
      overallRating: review.overallRating,
      relevancyRating: review.relevancyRating,
      facultyRating: review.facultyRating,
      contentRating: review.contentRating,
      description: review.description,
    };
  }
}
