import type { Request, Response, NextFunction, RequestHandler } from 'express';
import expressAsyncHandler from 'express-async-handler';

/**
 * Wrapper around express-async-handler that permits handlers which return a
 * value (the common `return res.json(...)` pattern) while keeping req/res
 * typed. express-async-handler's own types require a void return, which fights
 * that pattern.
 */
const asyncHandler = (
  handler: (req: Request, res: Response, next: NextFunction) => any
): RequestHandler => expressAsyncHandler(handler);

export default asyncHandler;
