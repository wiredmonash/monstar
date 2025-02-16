import { User } from "./user.model";
import { Types } from "mongoose";

export class Review {
  _id: Types.ObjectId;
  title: string;
  semester: string;
  grade: string;
  year: number;
  overallRating: number;
  relevancyRating: number;
  facultyRating: number;
  contentRating: number;
  description: string;
  author: Types.ObjectId | null;

  constructor (
    _id?: Types.ObjectId,
    title?: string,
    semester?: string,
    grade?: string,
    year?: number,
    overallRating?: number,
    relevancyRating?: number,
    facultyRating?: number,
    contentRating?: number,
    description?: string,
    author?: Types.ObjectId | null
  ) {
    this._id = _id || new Types.ObjectId();
    this.title = title || '';
    this.semester = semester || 'First semester';
    this.grade = grade || 'P';
    this.year = year || new Date().getFullYear();
    this.overallRating = overallRating ||  0;
    this.relevancyRating = relevancyRating || 0;
    this.facultyRating = facultyRating || 0;
    this.contentRating = contentRating || 0;
    this.description = description || '';
    this.author = author || null;
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
  ensureDefaults() {
    this.semester = this.semester ?? 1;
    this.grade = this.grade ?? 0;
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
  calcOverallRating() {
    const validRatings = [this.relevancyRating, this.facultyRating, this.contentRating].filter(rating => rating > 0);
    
    if (validRatings.length === 0) {
      this.overallRating = 0;
      return;
    }
    
    const sum = validRatings.reduce((acc, curr) => acc + curr, 0);
    this.overallRating = Number((sum / validRatings.length).toFixed(1));
  }
}