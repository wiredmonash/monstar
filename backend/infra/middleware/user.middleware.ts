import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload, VerifyErrors } from 'jsonwebtoken';

import { CreateError } from '@utilities/error';

const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.access_token;
  if (!token) return next(CreateError(401, 'You are not authenticated!'));

  jwt.verify(
    token,
    process.env.JWT_SECRET as string,
    (err: VerifyErrors | null, user?: JwtPayload | string) => {
      if (err) return next(CreateError(403, 'Token is not valid'));

      req.user = user as TokenPayload;
      next();
    }
  );
};

export = userMiddleware;
