import { Types } from 'mongoose';

// Define interface for SETU data
export interface SetuData {
  _id?: Types.ObjectId;
  unit_code?: string;
  unit_name?: string;
  code?: string;
  Season?: string;
  Responses?: number;
  Invited?: number;
  Response_Rate?: number;
  Level?: number;
  I1?: number[];
  I2?: number[];
  I3?: number[];
  I4?: number[];
  I5?: number[];
  I6?: number[];
  I7?: number[];
  I8?: number[];
  I9?: number[];
  I10?: number[];
  I11?: number[];
  I12?: number[];
  I13?: number[];
  agg_score?: number[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Setu {
  _id!: Types.ObjectId;
  unit_code!: string;
  unit_name!: string;
  code!: string;
  Season!: string;
  Responses!: number;
  Invited!: number;
  Response_Rate!: number;
  Level!: number;
  I1!: number[];
  I2!: number[];
  I3!: number[];
  I4!: number[];
  I5!: number[];
  I6!: number[];
  I7!: number[];
  I8!: number[];
  I9!: number[];
  I10!: number[];
  I11!: number[];
  I12!: number[];
  I13!: number[];
  agg_score!: number[];
  createdAt!: Date;
  updatedAt!: Date;

  constructor(data?: SetuData) {
    if (data) {
      this._id = data._id!;
      this.unit_code = data.unit_code ?? '';
      this.unit_name = data.unit_name ?? '';
      this.code = data.code ?? '';
      this.Season = data.Season ?? '';
      this.Responses = data.Responses ?? 0;
      this.Invited = data.Invited ?? 0;
      this.Response_Rate = data.Response_Rate ?? 0;
      this.Level = data.Level ?? 0;
      this.I1 = data.I1 ?? [];
      this.I2 = data.I2 ?? [];
      this.I3 = data.I3 ?? [];
      this.I4 = data.I4 ?? [];
      this.I5 = data.I5 ?? [];
      this.I6 = data.I6 ?? [];
      this.I7 = data.I7 ?? [];
      this.I8 = data.I8 ?? [];
      this.I9 = data.I9 ?? [];
      this.I10 = data.I10 ?? [];
      this.I11 = data.I11 ?? [];
      this.I12 = data.I12 ?? [];
      this.I13 = data.I13 ?? [];
      this.agg_score = data.agg_score ?? [];
      this.createdAt = data.createdAt ?? new Date();
      this.updatedAt = data.updatedAt ?? new Date();
    }
  }

  // Calculate average score for a specific criteria
  getAverageScore(
    criteria: keyof Pick<
      Setu,
      | 'I1'
      | 'I2'
      | 'I3'
      | 'I4'
      | 'I5'
      | 'I6'
      | 'I7'
      | 'I8'
      | 'I9'
      | 'I10'
      | 'I11'
      | 'I12'
      | 'I13'
    >
  ): number {
    const scores = this[criteria];
    if (!scores || scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  // Get all evaluation criteria with their average scores
  getAllCriteriaScores(): { label: string; score: number; key: string }[] {
    const criteriaLabels: { [key: string]: string } = {
      // University Wide Items (I1-I8)
      I1: 'Learning Outcomes Were Clear',
      I2: 'Assessment Instructions Were Clear',
      I3: 'Assessment Demonstrated Learning Outcomes',
      I4: 'Feedback Helped Achieve Learning Outcomes',
      I5: 'Resources Helped Achieve Learning Outcomes',
      I6: 'Activities Helped Achieve Learning Outcomes',
      I7: 'I Engaged to Best of My Ability',
      I8: 'Overall Satisfaction With Unit',

      // Faculty Wide Items (I9-I13)
      I9: 'Assessment Developed Knowledge & Skills',
      I10: 'Could See How Topics Related',
      I11: 'Good Mix of Theory & Application',
      I12: 'Encouraged Active Participation',
      I13: 'Improved Critical Thinking',
    };

    return Object.keys(criteriaLabels).map((key) => ({
      label: criteriaLabels[key],
      score: this.getAverageScore(
        key as keyof Pick<
          Setu,
          | 'I1'
          | 'I2'
          | 'I3'
          | 'I4'
          | 'I5'
          | 'I6'
          | 'I7'
          | 'I8'
          | 'I9'
          | 'I10'
          | 'I11'
          | 'I12'
          | 'I13'
        >
      ),
      key,
    }));
  }

  // Get overall aggregate score
  getAggregateScore(): number {
    if (!this.agg_score || this.agg_score.length === 0) return 0;
    return this.agg_score[0];
  }

   // Get average of university-wide criteria scores (I1-I8)
   getUniversityWideAverage(): number {
    const universityCriteriaKeys = ['I1', 'I2', 'I3', 'I4', 'I5', 'I6', 'I7', 'I8'];
    const scores = universityCriteriaKeys.map(key => 
      this.getAverageScore(key as any)
    ).filter(score => score > 0); // Filter out criteria with no data

    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

   // Get average of faculty-wide criteria scores (I9-I13)
   getFacultyWideAverage(): number {
    const facultyCriteriaKeys = ['I9', 'I10', 'I11', 'I12', 'I13'];
    const scores = facultyCriteriaKeys.map(key => 
      this.getAverageScore(key as any)
    ).filter(score => score > 0); // Filter out criteria with no data
    
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
}
