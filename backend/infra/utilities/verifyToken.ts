import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload, VerifyErrors } from 'jsonwebtoken';

import { CreateError } from '@utilities/error';

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
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

const verifyUser = (req: Request, res: Response, next: NextFunction) => {
  verifyToken(req, res, () => {
    if (req.user?.id === req.params.id || req.user?.admin) {
      next();
    }

    return next(
      CreateError(403, 'You are not authorized! You are not a user nor admin.')
    );
  });
};

const verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
  verifyToken(req, res, () => {
    if (req.user?.admin) {
      next();
    }

    return next(
      CreateError(403, 'You are not authorized! You are not an admin.')
    );
  });
};

export { verifyToken, verifyUser, verifyAdmin };
