import type { Model, HydratedDocument, Types } from 'mongoose';

import NotificationModel from './notification';
import OrgLogoModel from './orgLogo';
import ReviewModel from './review';
import SetuModel from './setu';
import UnitModel from './unit';
import UserModel from './user';

/**
 * Shared model document types, derived from the models (whose schemas are the
 * single source of truth). The model files use `export = Model` for CommonJS
 * interop, which can't also carry a named type export — so the inferred types
 * are surfaced here instead.
 *
 * Consume with: import type { IUnit } from '@models/types';
 */

type DocOf<M> = M extends Model<infer T> ? HydratedDocument<T> : never;

// Plain (schema-inferred) shape, as returned by `.lean()` — no document methods.
type PlainOf<M> = M extends Model<infer T> ? T : never;

export type Id = string | Types.ObjectId;

export interface Job {
  notionId: string;
  Status?: string;
  'Role Type'?: string[];
  [key: string]: unknown;
}

export type INotification = DocOf<typeof NotificationModel>;
export type IOrgLogo = DocOf<typeof OrgLogoModel>;
export type IReview = DocOf<typeof ReviewModel>;
export type ISETU = DocOf<typeof SetuModel>;
export type IUnit = DocOf<typeof UnitModel>;
export type IUser = DocOf<typeof UserModel>;

export type IReviewLean = PlainOf<typeof ReviewModel>;
export type ISETULean = PlainOf<typeof SetuModel>;
