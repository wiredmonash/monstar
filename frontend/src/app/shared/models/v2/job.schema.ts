export interface IJob {
  notionId: string;
  lastVerified: Date;
  status: 'OPEN' | 'CLOSED';
  sourceLink: string;
  scope: string;
  applicationLink: string;
  eligibility: string;
  roleType: string[];
  interviewWindow: string | Date;
  opportunityTitle: string;
  timeCommitment: string[];
  closeDate: Date;
  organisation: string;
}
