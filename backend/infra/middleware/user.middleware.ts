import jwt from 'jsonwebtoken';

import { CreateError } from '@utilities/error';

const userMiddleware = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) return next(CreateError(401, 'You are not authenticated!'));

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(CreateError(403, 'Token is not valid'));

    req.user = user;
    next();
  });
};

export = userMiddleware;
