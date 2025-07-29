import { Unit } from "./unit.model";
import { User } from "./user.model";
import { Types } from "mongoose";

// Define interface for review data
export interface ReviewData {
  _id?: Types.ObjectId;
  title?: string;
  semester?: string;
  grade?: string;
  year?: number;
  overallRating?: number;
  relevancyRating?: number;
  facultyRating?: number;
  contentRating?: number;
  description?: string;
  unit?: Types.ObjectId | Unit | null;
  author?: Types.ObjectId | User | null;
  likes?: number;
  dislikes?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Review {
  _id!: Types.ObjectId;
  title!: string;
  semester!: string;
  grade!: string;
  year!: number;
  overallRating!: number;
  relevancyRating!: number;
  facultyRating!: number;
  contentRating!: number;
  description!: string;
  unit!: Types.ObjectId | Unit | null;
  author!: Types.ObjectId | User | null;
  likes!: number;
  dislikes!: number;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(data?: ReviewData) {
    // Handle case where data is undefined
    if (!data) {
      this._id = new Types.ObjectId();
      this.title = '';
      this.semester = 'First semester';
      this.grade = 'P';
      this.year = new Date().getFullYear();
      this.overallRating = 0;
      this.relevancyRating = 0;
      this.facultyRating = 0;
      this.contentRating = 0;
      this.description = '';
      this.unit = null;
      this.author = null;
      this.likes = 0;
      this.dislikes = 0;
      return;
    }

    // Assign values with safe property access
    this._id = data._id ?? new Types.ObjectId();
    this.title = data.title ?? '';
    this.semester = data.semester ?? 'First semester';
    this.grade = data.grade ?? 'P';
    this.year = data.year ?? new Date().getFullYear();
    this.overallRating = data.overallRating ?? 0;
    this.relevancyRating = data.relevancyRating ?? 0;
    this.facultyRating = data.facultyRating ?? 0;
    this.contentRating = data.contentRating ?? 0;
    this.description = data.description ?? '';
    this.unit = data.unit ?? null;
    this.author = data.author ?? null;
    this.likes = data.likes ?? 0;
    this.dislikes = data.dislikes ?? 0;
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
  }

  // Utility method to check if unit is populated
  hasPopulatedUnit(): boolean {
    return this.unit instanceof Object && !(this.unit instanceof Types.ObjectId);
  }

  // Utility method to get unit code safely
  getUnitCode(): string | undefined {
    if (this.hasPopulatedUnit()) {
      return (this.unit as Unit).unitCode;
    }

    return undefined;
  }

  // Validates the values
  isValid(): boolean {
    return (
      this.year > 0 &&
      this.overallRating >= 0 && this.overallRating <= 5 &&
      this.relevancyRating >= 0 && this.relevancyRating <= 5 &&
      this.facultyRating >= 0 && this.facultyRating <= 5 &&
      this.contentRating >= 0 && this.contentRating <= 5 &&
      this.description.trim().length > 0
    );
  }

  // Ensure all rating properties default to 0 if undefined
  ensureDefaults(): void {
    this.semester = this.semester ?? 'First semester';
    this.grade = this.grade ?? 'P';
    this.year = this.year ?? new Date().getFullYear();
    this.overallRating = this.overallRating ?? 0;
    this.relevancyRating = this.relevancyRating ?? 0;
    this.facultyRating = this.facultyRating ?? 0;
    this.contentRating = this.contentRating ?? 0;
  }

  /**
   * * Calculates the overall rating based on the other ratings
   * 
   * - If no ratings are provided, overall rating is set to 0
   * - Otherwise, the overall rating is the average of the provided ratings
   * - The overall rating is rounded to 1 decimal place
   */
  calcOverallRating(): void {
    const validRatings = [this.relevancyRating, this.facultyRating, this.contentRating]
      .filter(rating => rating > 0);
    
    if (validRatings.length === 0) {
      this.overallRating = 0;
      return;
    }
    
    const sum = validRatings.reduce((acc, curr) => acc + curr, 0);
    this.overallRating = Number((sum / validRatings.length).toFixed(1));
  }
}