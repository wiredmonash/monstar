import type { Request, Response } from 'express';

import GithubService from './github.service';

/**
 * Controller for the GitHub contributors endpoint.
 */
class GithubController {
  /**
   * GET /contributors — return formatted repo contributors (or fallback data).
   *
   * The service handles all errors internally and always resolves to a payload,
   * so this responds with HTTP 200 in every case (matching v1).
   */
  static async getContributors(req: Request, res: Response) {
    const payload = await GithubService.getContributors();
    return res.status(200).json(payload);
  }
}

export default GithubController;
