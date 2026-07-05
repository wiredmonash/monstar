import type { Model, HydratedDocument, Types } from 'mongoose';

/**
 * Generic helpers for deriving document/lean types from a Mongoose model.
 * The model schemas remain the single source of truth; subdomains derive their
 * own `I*` types from these helpers (see each `*.types.ts`).
 */

export type DocOf<M> = M extends Model<infer T> ? HydratedDocument<T> : never;

// Plain (schema-inferred) shape, as returned by `.lean()` — no document methods.
export type PlainOf<M> = M extends Model<infer T> ? T : never;

export type Id = string | Types.ObjectId;
