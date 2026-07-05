import type { DocOf, PlainOf } from '@shared/types';

import ReviewModel from './review.model';

export type IReview = DocOf<typeof ReviewModel>;
export type IReviewLean = PlainOf<typeof ReviewModel>;
