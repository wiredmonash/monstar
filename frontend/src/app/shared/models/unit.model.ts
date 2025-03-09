import { Types } from "mongoose";
import { Review } from "./review.model";

export enum UnitTag {
    MOST_REVIEWS = 'most-reviews',
    CONTROVERSIAL = 'controversial',
    WAM_BOOSTER = 'wam-booster'
}

export interface Requisites {
    permission: boolean;
    prerequisites: { NumReq: number, units: string[] }[];
    corequisites: string[];
    prohibitions: string[];
    cpRequired: number;
}

export interface Offering {
    location: string;
    mode: string;
    name: string;
    period: string;
    _id: Types.ObjectId;
}

// Define interface for unit data
export interface UnitData {
    _id?: Types.ObjectId;
    unitCode?: string;
    name?: string;
    description?: string;
    reviews?: Review[];
    avgOverallRating?: number;
    avgRelevancyRating?: number;
    avgFacultyRating?: number;
    avgContentRating?: number;
    level?: number;
    creditPoints?: number;
    school?: string;
    academicOrg?: string;
    scaBand?: number;
    requisites?: Requisites;
    offerings?: Offering[];
    tags?: UnitTag[];
}

export class Unit {
    _id!: Types.ObjectId;
    unitCode!: string;
    name!: string;
    description!: string;
    reviews!: Review[];
    avgOverallRating!: number;
    avgRelevancyRating!: number;
    avgFacultyRating!: number;
    avgContentRating!: number;
    level!: number;
    creditPoints!: number;
    school!: string;
    academicOrg!: string;
    scaBand!: number;
    requisites!: Requisites;
    offerings!: Offering[];
    tags: UnitTag[] = [];

    constructor(data?: UnitData) {
        // Handle case where data is undefined
        if (!data) {
            this._id = new Types.ObjectId();
            this.unitCode = '';
            this.name = '';
            this.description = '';
            this.reviews = [];
            this.avgOverallRating = 0;
            this.avgRelevancyRating = 0;
            this.avgFacultyRating = 0;
            this.avgContentRating = 0;
            this.level = 0;
            this.creditPoints = 0;
            this.school = '';
            this.academicOrg = '';
            this.scaBand = 0;
            this.requisites = {
                permission: false,
                prerequisites: [],
                corequisites: [],
                prohibitions: [],
                cpRequired: 0
            };
            this.offerings = [];
            this.tags = [];
            return;
        }

        // Assign values with safe property access
        this._id = data._id ?? new Types.ObjectId();
        this.unitCode = data.unitCode ?? '';
        this.name = data.name ?? '';
        this.description = data.description ?? '';
        this.reviews = data.reviews ?? [];
        this.avgOverallRating = data.avgOverallRating ?? 0;
        this.avgRelevancyRating = data.avgRelevancyRating ?? 0;
        this.avgFacultyRating = data.avgFacultyRating ?? 0;
        this.avgContentRating = data.avgContentRating ?? 0;
        this.level = data.level ?? 0;
        this.creditPoints = data.creditPoints ?? 0;
        this.school = data.school ?? '';
        this.academicOrg = data.academicOrg ?? '';
        this.scaBand = data.scaBand ?? 0;
        this.requisites = data.requisites ?? {
            permission: false,
            prerequisites: [],
            corequisites: [],
            prohibitions: [],
            cpRequired: 0
        };
        this.offerings = data.offerings ?? [];
        this.tags = data.tags ?? [];
    }

    // Ensure all rating properties default to 0 if undefined
    ensureDefaults(): void {
        this.avgOverallRating = this.avgOverallRating ?? 0;
        this.avgRelevancyRating = this.avgRelevancyRating ?? 0;
        this.avgFacultyRating = this.avgFacultyRating ?? 0;
        this.avgContentRating = this.avgContentRating ?? 0;
    }

    // Calculates the average ratings based on reviews
    calculateAverageRatings(): void {
        if (this.reviews.length > 0) {
            this.avgOverallRating = this.reviews.reduce((sum, review) => sum + review.overallRating, 0) / this.reviews.length;
            this.avgRelevancyRating = this.reviews.reduce((sum, review) => sum + review.relevancyRating, 0) / this.reviews.length;
            this.avgFacultyRating = this.reviews.reduce((sum, review) => sum + review.facultyRating, 0) / this.reviews.length;
            this.avgContentRating = this.reviews.reduce((sum, review) => sum + review.contentRating, 0) / this.reviews.length;
        } else {
            this.ensureDefaults();
        }
    }

    // Helper method to check if unit has a specific tag
    hasTag(tag: UnitTag): boolean {
        return this.tags.includes(tag);
    }

    // Keep compatibility with old constructor form
    static fromDetailedConstructor(
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
        offerings: Offering[],
        tags?: UnitTag[]
    ): Unit {
        return new Unit({
            _id, unitCode, name, description, reviews, 
            avgOverallRating, avgRelevancyRating, avgFacultyRating, avgContentRating,
            level, creditPoints, school, academicOrg, scaBand, requisites, offerings, tags
        });
    }
}