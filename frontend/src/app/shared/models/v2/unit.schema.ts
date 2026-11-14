import { IUnitCardEnum } from './enums';
import { IReview, IReviewAuthorPopulated } from './review.schema';

interface Requisite {
  NumReq?: number;
  units: string[];
}

export interface IOffering {
  location: string;
  mode: string;
  name: string;
  period: string;
}

export interface AiOverview {
  summary?: string;
  generatedAt?: Date;
  model?: string;
  totalReviewsConsidered?: number;
  setuSeasons?: string[];
}

interface BaseUnit {
  _id: string;
  unitCode: string;
  name: string;
  description: string;

  avgOverallRating: number;
  avgRelevancyRating: number;
  avgFacultyRating: number;
  avgContentRating: number;

  level: number;
  creditPoints: number;
  school: string;
  academicOrg: string;
  scaBand: string;

  requisites: {
    permission: boolean;
    prohibitions: string[];
    corequisites: Requisite[];
    prerequisites: Requisite[];
    cpRequired: number;
  };
  offerings: IOffering[];

  tags: IUnitCardEnum[];

  aiOverview?: AiOverview;
}

export interface IUnit extends BaseUnit {
  reviews: (string | IReview)[];
}

export interface IUnitDeeplyPopulated extends BaseUnit {
  reviews: IReviewAuthorPopulated[];
}
