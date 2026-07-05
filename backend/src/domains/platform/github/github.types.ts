/**
 * Shape of a contributor entry as returned by the GitHub REST API.
 */
export interface GitHubContributor {
  login: string;
  type: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}
