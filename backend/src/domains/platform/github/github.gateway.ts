import axios from 'axios';

import type { GitHubContributor } from './github.types';

const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'wiredmonash';
const REPO_NAME = 'monstar';

/**
 * Get GitHub token from environment variables
 *
 * TODO: Check if this is still required now that the repo is public.
 */
const getGitHubToken = () => {
  return process.env.GITHUB_TOKEN;
};

/**
 * Get authenticated headers for GitHub API requests
 */
const getAuthHeaders = () => {
  const token = getGitHubToken();
  if (token) {
    return {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    };
  }
  return {
    Accept: 'application/vnd.github.v3+json',
  };
};

/**
 * External access to the GitHub REST API.
 *
 * IMPORTANT: uses the DEFAULT axios export and calls axios.get / axios.isAxiosError
 * directly (never axios.create()) so the endpoint's tests can mock axios.
 */
class GithubGateway {
  /**
   * Fetch the raw contributor list for the MonSTAR repository.
   */
  static async fetchContributors(): Promise<GitHubContributor[]> {
    const headers = getAuthHeaders();
    console.log('Fetching contributors from GitHub API');

    // Try to fetch contributors from GitHub API
    const response = await axios.get<GitHubContributor[]>(
      `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contributors`,
      { headers }
    );

    return response.data;
  }

  /**
   * Whether an error means the repository is private or the token is invalid
   * (GitHub responds 401/403 in that case).
   */
  static isRepositoryAccessError(error: unknown): boolean {
    return (
      axios.isAxiosError(error) &&
      (error.response?.status === 401 || error.response?.status === 403)
    );
  }
}

export default GithubGateway;
