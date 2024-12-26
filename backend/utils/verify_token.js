const jwt = require('jsonwebtoken');
const { CreateError } = require('./error.js');

const verifyToken = (req, res, next) => {
    // Get the token from cookies
    const token = req.cookies.access_token;

    // Handle no token error
    if (!token)
        return next(CreateError(401, 'You are not authenticated!'));

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        // Handle invalid token error
        if (err)
            return next(CreateError(403, 'Token is not valid'));
        
        req.user = user;
        next();
    });
}

const verifyUser = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.id === req.params.id || req.user.isAdmin) {
            next();
        }

        return next(createError(403, 'You are not authorized! You are not a user nor admin.'));
    });
};

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.isAdmin) {
            next();
        }

        return next(CreateError(403, 'You are not authorized! You are not an admin.'))
    });
};

module.exports = { verifyToken, verifyUser, verifyAdmin };