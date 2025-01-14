import { User } from "./user.model";
import { Types } from "mongoose";

export class Review {
  _id: Types.ObjectId;
  title: string;
  semester: number;
  grade: number;
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
    semester?: number,
    grade?: number,
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
    this.semester = semester || 1;
    this.grade = grade || 0; 
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
      this.semester >= 1 && this.semester <= 2 &&
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

  // Calculates the overall rating
  calcOverallRating() {
    this.overallRating = Math.round((this.relevancyRating + this.facultyRating + this.contentRating) / 3);
  }
}