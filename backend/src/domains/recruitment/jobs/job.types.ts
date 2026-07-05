export interface Job {
  notionId: string;
  Status?: string;
  'Role Type'?: string[];
  [key: string]: unknown;
}
