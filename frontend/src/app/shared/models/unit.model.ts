import { Types } from "mongoose";
import { Review } from "./review.model";

interface Requisites {
    permission: boolean;
    prerequisites: string[];
    corequisites: string[];
    prohibitions: string[];
    cpRequired: number;
}

interface Offering {
    location: string;
    mode: string;
    name: string;
    period: string;
    _id: Types.ObjectId;
}

export class Unit {
    _id: Types.ObjectId;
    unitCode: string;
    name: string;
    description: string;
    reviews: Review[];
    avgOverallRating: number;
    avgRelevancyRating: number;
    avgFacultyRating: number;
    avgContentRating: number;
    level: number;
    creditPoints: number;
    school: string;
    academicOrg: string;
    scaBand: number;
    requisites: Requisites;
    offerings: Offering[];

    constructor (
        _id: Types.ObjectId,
        unitCode: string, 
        name: string, 
        description: string,
        reviews: Review[],
        avgOverallRating: number,
        avgRelevancyRating: number,
        avgFacultyRating: number,
        avgContentRating: number,
        level: number,
        creditPoints: number,
        school: string,
        academicOrg: string,
        scaBand: number,
        requisites: Requisites,
        offerings: Offering[]
    ) {
        this._id = _id;
        this.unitCode = unitCode;
        this.name = name;
        this.description = description;
        this.reviews = reviews;
        this.avgOverallRating = avgOverallRating;
        this.avgRelevancyRating = avgRelevancyRating;
        this.avgFacultyRating = avgFacultyRating;
        this.avgContentRating = avgContentRating;
        this.level = level;
        this.creditPoints = creditPoints;
        this.school = school;
        this.academicOrg = academicOrg;
        this.scaBand = scaBand;
        this.requisites = requisites;
        this.offerings = offerings;
    }

    // Ensure all rating properties default to 0 if undefined
    ensureDefaults() {
        this.avgOverallRating = this.avgOverallRating ?? 0;
        this.avgRelevancyRating = this.avgRelevancyRating ?? 0;
        this.avgFacultyRating = this.avgFacultyRating ?? 0;
        this.avgContentRating = this.avgContentRating ?? 0;
    }

    // Calculates the average ratings based on reviews
    calculateAverageRatings() {
        if (this.reviews.length > 0) {
            this.avgOverallRating = this.reviews.reduce((sum, review) => sum + review.overallRating, 0) / this.reviews.length;
            this.avgRelevancyRating = this.reviews.reduce((sum, review) => sum + review.relevancyRating, 0) / this.reviews.length;
            this.avgFacultyRating = this.reviews.reduce((sum, review) => sum + review.facultyRating, 0) / this.reviews.length;
            this.avgContentRating = this.reviews.reduce((sum, review) => sum + review.contentRating, 0) / this.reviews.length;
        } else {
            this.ensureDefaults();
        }
    }
}