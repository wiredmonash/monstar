import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Forwards a rejected async handler to Express's error middleware (Express 4
 * does not do this itself). Handlers may return a value, so the common
 * `return res.json(...)` pattern type-checks.
 */
const asyncHandler =
  (
    handler: (req: Request, res: Response, next: NextFunction) => any
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

export default asyncHandler;
