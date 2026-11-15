import { Grade, Semester } from './enums';
import { IUnit } from './unit.schema';
import { IUser } from './user.schema';

interface BaseReview {
  _id: string;
  title: string;
  description: string;
  semester: Semester;
  grade: Grade | null;
  year: number;

  overallRating: number;
  relevancyRating: number;
  facultyRating: number;
  contentRating: number;

  likes: number;
  dislikes: number;

  author: string | IUser;

  createdAt: Date;
  updatedAt: Date;
}

export interface IReview extends BaseReview {
  unit: string | IUnit | null;
}

export interface IReviewAuthorPopulated extends BaseReview {
  author: IUser;
  unit: string | IUnit | null;
}

export interface IReviewFullyPopulated extends BaseReview {
  author: IUser;
  unit: IUnit;
}

export interface ICreateReview extends Omit<
  BaseReview,
  '_id' | 'likes' | 'dislikes' | 'createdAt' | 'updatedAt'
> {
  author: string;
}

export interface IUpdateReview extends ICreateReview {
  _id: string;
}

/**
 * A blank review for the write-review form to start from.
 */
export const emptyReview = (): IUpdateReview => ({
  _id: '',
  author: '',
  title: 'Enter your title',
  description: 'Enter your description',
  semester: 'First semester',
  grade: null,
  year: new Date().getFullYear(),
  overallRating: 0,
  relevancyRating: 0,
  facultyRating: 0,
  contentRating: 0,
});
