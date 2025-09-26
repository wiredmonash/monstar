const jwt = require('jsonwebtoken');
const { CreateError } = require('./error.js');

/**
 * * Middleware to verify the JWT token from cookies.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {Function} next Express next middleware function
 */
const verifyToken = (req, res, next) => {
  // Get the token from cookies
  const token = req.cookies.access_token;

  // Handle no token error
  if (!token) return next(CreateError(401, 'You are not authenticated!'));

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    // Handle invalid token error
    if (err) return next(CreateError(403, 'Token is not valid'));

    req.user = user;
    next();
  });
};

/**
 * * Middleware to verify the user is authorised to access the resource.
 * User must be the owner of the resource or an admin.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {Function} next Express next middleware function
 */
const verifyUser = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.admin) {
      next();
    }

    return next(
      createError(403, 'You are not authorized! You are not a user nor admin.')
    );
  });
};

/**
 * * Middleware to verify if the user is an admin.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param {Function} next Express next middleware function
 */
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.admin) {
      next();
    }

    return next(
      CreateError(403, 'You are not authorized! You are not an admin.')
    );
  });
};

module.exports = { verifyToken, verifyUser, verifyAdmin };
