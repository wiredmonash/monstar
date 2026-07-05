import GithubGateway from './github.gateway';
import type { GitHubContributor } from './github.types';

/**
 * Business logic for the GitHub contributors endpoint. Formats the live API
 * response and always degrades to a static fallback list, so the endpoint never
 * fails — every path resolves to a 200-shaped payload.
 */
class GithubService {
  /**
   * Get fallback contributor data for private repository
   *
   * Returns a predefined list of contributors when the GitHub API is unavailable
   * or the repository is private and inaccessible
   *
   * @returns {Array} Array of contributor objects with username, name, avatar_url, contributions, html_url, and type
   */
  static getFallbackContributors() {
    return [
      {
        username: 'jenul-ferdinand',
        name: 'Jenul Ferdinand',
        avatar_url: 'https://avatars.githubusercontent.com/u/jenul-ferdinand',
        contributions: 150,
        html_url: 'https://github.com/jenul-ferdinand',
        type: 'User',
      },
      {
        username: 'Rikidink',
        name: 'Ricky Zhang',
        avatar_url: 'https://avatars.githubusercontent.com/u/Rikidink',
        contributions: 45,
        html_url: 'https://github.com/Rikidink',
        type: 'User',
      },
      {
        username: 'dlnphng',
        name: 'Phuong Do',
        avatar_url: 'https://avatars.githubusercontent.com/u/dlnphng',
        contributions: 32,
        html_url: 'https://github.com/dlnphng',
        type: 'User',
      },
      {
        username: 'neviskawatra',
        name: 'Nevis Kawatra',
        avatar_url: 'https://avatars.githubusercontent.com/u/neviskawatra',
        contributions: 28,
        html_url: 'https://github.com/neviskawatra',
        type: 'User',
      },
    ];
  }

  /**
   * Filter to human contributors, cap and sort them, and format for the client.
   *
   * NOTE: preserves v1 behavior — slice(0, 10) runs BEFORE the sort, so it caps
   * the first 10 in API order and only then sorts those by contributions desc.
   */
  static formatContributors(contributors: GitHubContributor[]) {
    return contributors
      .filter((c) => c.type === 'User')
      .slice(0, 10) // Limit to top 10 contributors
      .sort((a, b) => b.contributions - a.contributions)
      .map((c) => ({
        username: c.login,
        name: c.login,
        avatar_url: c.avatar_url,
        contributions: c.contributions,
        html_url: c.html_url,
        type: c.type,
      }));
  }

  /**
   * Fetch and format contributors, falling back to static data on any error or
   * empty response. Always resolves to a { success, status, message, data }
   * payload that the controller sends with HTTP 200.
   */
  static async getContributors() {
    try {
      const data = await GithubGateway.fetchContributors();

      if (data && data.length > 0) {
        console.log(`Found ${data.length} contributors from GitHub API`);

        // Filter and format contributors
        const contributors = this.formatContributors(data);

        console.log(`Returning ${contributors.length} formatted contributors`);
        return {
          success: true,
          status: 200,
          message: 'Contributors fetched successfully',
          data: contributors,
        };
      } else {
        // Return fallback data if no contributors found
        console.log('No contributors found, using fallback data');
        return {
          success: true,
          status: 200,
          message: 'Using fallback contributor data',
          data: this.getFallbackContributors(),
        };
      }
    } catch (error) {
      console.error('Error fetching GitHub contributors:', error);

      // If it's an authentication error or repository is private, return fallback data
      if (GithubGateway.isRepositoryAccessError(error)) {
        console.log(
          'Repository is private or token is invalid. Using fallback data.'
        );
        return {
          success: true,
          status: 200,
          message: 'Repository is private. Using fallback contributor data',
          data: this.getFallbackContributors(),
        };
      }

      // For other errors, return fallback data
      console.log('GitHub API error, using fallback data');
      return {
        success: true,
        status: 200,
        message: 'Error fetching contributors. Using fallback data',
        data: this.getFallbackContributors(),
      };
    }
  }
}

export default GithubService;
