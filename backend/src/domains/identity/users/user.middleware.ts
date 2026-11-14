import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload, VerifyErrors } from 'jsonwebtoken';

import {
  Error401NotAuthorized,
  Error403Forbidden,
} from '@shared/errors/errors';

const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.access_token;
  if (!token)
    return next(new Error401NotAuthorized('You are not authenticated!'));

  jwt.verify(
    token,
    process.env.JWT_SECRET as string,
    (err: VerifyErrors | null, user?: JwtPayload | string) => {
      if (err) return next(new Error403Forbidden('Token is not valid'));

      req.user = user as TokenPayload;
      next();
    }
  );
};

export default userMiddleware;
