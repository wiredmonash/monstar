import type { Request, Response, NextFunction } from 'express';

import { Error403Forbidden } from '@shared/errors/errors';

import userMiddleware from './user.middleware';

const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  userMiddleware(req, res, (err) => {
    if (err) return next(err);

    if (req.user?.isAdmin) return next();

    return next(
      new Error403Forbidden('You are not authorised! You are not an admin.')
    );
  });
};

export default adminMiddleware;
