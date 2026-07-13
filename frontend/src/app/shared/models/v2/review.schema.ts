import { z } from 'zod';
import { gradesEnum, semestersEnum } from './enums';
import { IUnit, UnitSchema } from './unit.schema';
import { UserSchema } from './user.schema';

const BaseReviewSchema = z.object({
  _id: z.string(),
  title: z
    .string()
    .min(1, { message: 'Title is required' })
    .default('Enter your title'),
  description: z
    .string()
    .min(1, { message: 'Description is required' })
    .default('Enter your description'),
  semester: semestersEnum.default('First semester'),
  grade: gradesEnum.nullable().default(null),
  year: z
    .number()
    .int()
    .min(2000, { message: 'Year cannot be before 2000' })
    .default(new Date().getFullYear()),

  overallRating: z.number().min(0).max(5).default(0),
  relevancyRating: z.number().min(0).max(5).default(0),
  facultyRating: z.number().min(0).max(5).default(0),
  contentRating: z.number().min(0).max(5).default(0),

  likes: z.number().default(0),
  dislikes: z.number().default(0),

  author: z.union([z.string(), UserSchema]),

  createdAt: z.date(),
  updatedAt: z.date(),
});

// Had to add unit field manually to fix circular type inference
export interface IReview extends z.infer<typeof BaseReviewSchema> {
  unit: string | IUnit | null;
}
export const ReviewSchema: z.ZodType<IReview> = BaseReviewSchema.extend({
  unit: z.union([z.string(), z.lazy(() => UnitSchema), z.null()]),
});

export const ReviewUnitPopulatedSchema = BaseReviewSchema.extend({
  unit: UnitSchema,
});
export interface IReviewUnitPopulated extends z.infer<
  typeof ReviewUnitPopulatedSchema
> {}

export const ReviewAuthorPopulatedSchema = BaseReviewSchema.extend({
  author: UserSchema,
  unit: z.union([z.string(), UnitSchema, z.null()]),
});
export interface IReviewAuthorPopulated extends z.infer<
  typeof ReviewAuthorPopulatedSchema
> {}

export const ReviewFullyPopulatedSchema = BaseReviewSchema.extend({
  author: UserSchema,
  unit: UnitSchema,
});
export interface IReviewFullyPopulated extends z.infer<
  typeof ReviewFullyPopulatedSchema
> {}

export const CreateReviewSchema = BaseReviewSchema.omit({
  _id: true,
  likes: true,
  dislikes: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  author: z.string(),
});
export const UpdateReviewSchema = CreateReviewSchema.extend({
  _id: z.string(),
});
export interface ICreateReview extends z.infer<typeof CreateReviewSchema> {}
export interface IUpdateReview extends z.infer<typeof UpdateReviewSchema> {}
