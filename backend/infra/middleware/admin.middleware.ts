import type { Request, Response, NextFunction } from 'express';

import { CreateError } from '@utilities/error';

import userMiddleware from './user.middleware';

const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  userMiddleware(req, res, (err) => {
    if (err) return next(err);

    if (req.user?.isAdmin) return next();

    return next(
      CreateError(403, 'You are not authorised! You are not an admin.')
    );
  });
};

export = adminMiddleware;
