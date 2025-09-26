// Module Imports
const express = require('express');
const axios = require('axios');

// Router instance
const router = express.Router();

// GitHub API configuration
const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'wiredmonash';
const REPO_NAME = 'monstar';

/**
 * Get GitHub token from environment variables
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
 * Get fallback contributor data for private repository
 *
 * Returns a predefined list of contributors when the GitHub API is unavailable
 * or the repository is private and inaccessible
 *
 * @returns {Array} Array of contributor objects with username, name, avatar_url, contributions, html_url, and type
 */
const getFallbackContributors = () => {
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
};

/**
 * ! GET Get Contributors from GitHub Repository
 *
 * Fetches contributors from the MonSTAR GitHub repository. If the repository is private
 * or the GitHub API is unavailable, returns fallback contributor data.
 *
 * @async
 * @returns {JSON} Responds with a list of contributors in JSON format.
 * @throws {500} If an error occurs whilst fetching contributors from GitHub API.
 */
router.get('/contributors', async (req, res) => {
  try {
    const headers = getAuthHeaders();
    console.log('Fetching contributors from GitHub API');

    // Try to fetch contributors from GitHub API
    const response = await axios.get(
      `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contributors`,
      { headers }
    );

    if (response.data && response.data.length > 0) {
      console.log(`Found ${response.data.length} contributors from GitHub API`);

      // Filter and format contributors
      const contributors = response.data
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

      console.log(`Returning ${contributors.length} formatted contributors`);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Contributors fetched successfully',
        data: contributors,
      });
    } else {
      // Return fallback data if no contributors found
      console.log('No contributors found, using fallback data');
      const fallbackData = getFallbackContributors();
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Using fallback contributor data',
        data: fallbackData,
      });
    }
  } catch (error) {
    console.error('Error fetching GitHub contributors:', error);

    // If it's an authentication error or repository is private, return fallback data
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      console.log(
        'Repository is private or token is invalid. Using fallback data.'
      );
      const fallbackData = getFallbackContributors();
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Repository is private. Using fallback contributor data',
        data: fallbackData,
      });
    }

    // For other errors, return fallback data
    console.log('GitHub API error, using fallback data');
    const fallbackData = getFallbackContributors();
    return res.status(200).json({
      success: true,
      status: 200,
      message: 'Error fetching contributors. Using fallback data',
      data: fallbackData,
    });
  }
});

// Export the router
module.exports = router;
