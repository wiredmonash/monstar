import bcrypt from 'bcrypt';
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import multer from 'multer';

import User from '@models/user';
import { storage, cloudinary } from '@providers/cloudinary.provider';
const upload = multer({ storage });
import TokenProvider from '@providers/token.provider';
import { getErrorMessage } from '@utilities/getErrorMessage';
import { verifyToken, verifyAdmin } from '@utilities/verifyToken';

import dotenv from 'dotenv';
dotenv.config({ quiet: true });

const router = express.Router();
const client = new OAuth2Client();

/**
 * ! POST Login and/or register a User using Google
 *
 * @async
 * @returns {200} Responds with 200 status code if user is successfully registered/logged in
 * @throws {409} If the user already exists as a non-Google account
 * @throws {403} If the email is not a Monash Student email
 * @throws {500} If an error occurs whilst registering a user
 */
router.post('/google/authenticate', async function (req, res) {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Login and/or register a user using Google OAuth'

  const { idToken } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(403).json({
        error:
          'Access denied: Only students with a valid Monash email can log in.',
      });
    }
    // sub is the unique Google ID assigned to the user
    const { email, name, picture, sub } = payload; // eslint-disable-line

    // Regular expression to validate authcate and email
    const studentEmailRegex = /^[a-zA-Z]{4}\d{4}@student\.monash\.edu$/;
    const staffEmailRegex = /^[a-zA-Z]+\.[a-zA-Z]+@monash\.edu$/;

    // Invalid email error case
    if (!studentEmailRegex.test(email) && !staffEmailRegex.test(email)) {
      return res.status(403).json({
        error:
          'Access denied: Only students with a valid Monash email can log in.',
      });
    }

    // Check if the user already exists
    let user = await User.findOne({
      $or: [{ email: email }, { googleID: sub }],
    });

    // register the user if they aren't registered
    if (!user) {
      // Generate username based on email format
      let authcate;
      if (studentEmailRegex.test(email)) {
        authcate = email.split('@')[0];
      } else if (staffEmailRegex.test(email)) {
        authcate = email.split('.')[0];
      }

      user = new User({
        email: email,
        username: authcate,
        profileImg: picture,
        isGoogleUser: true,
        googleID: sub,
        verified: true,
      });
      await user.save();
    }

    // if there is a user but they are NOT a Google user but same email
    // (if they signed up using traditional way but then try logging in thru Google)
    if (!user.isGoogleUser) {
      return res
        .status(409)
        .json({ message: 'Account already exists as non-Google account.' });
    }

    const accessToken = TokenProvider.generateAccessToken(user._id, user.admin);
    const refreshToken = TokenProvider.generateRefreshToken();
    user.refreshToken = TokenProvider.hashRefreshToken(refreshToken);
    user.refreshTokenExpires = new Date(
      Date.now() + TokenProvider.REFRESH_TOKEN_EXPIRY
    );
    await user.save();

    // Return response as cookie with access token and user data.
    return res
      .cookie('access_token', accessToken, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: TokenProvider.ACCESS_TOKEN_EXPIRY,
      })
      .cookie('refresh_token', refreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: TokenProvider.REFRESH_TOKEN_EXPIRY,
      })
      .status(200)
      .json({ message: 'Login successful', data: user });
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error) });
  }
});

router.post('/refresh', async function (req, res) {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Refresh access token using refresh token'

  const { refresh_token } = req.cookies;
  if (!refresh_token) {
    return res.status(401).json({ error: 'No refresh token provided' });
  }

  try {
    const hashedToken = TokenProvider.hashRefreshToken(refresh_token);
    const user = await User.findOne({
      refreshToken: hashedToken,
      refreshTokenExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(403)
        .json({ error: 'Invalid or expired refresh token' });
    }

    const newAccessToken = TokenProvider.generateAccessToken(
      user._id,
      user.admin
    );
    const newRefreshToken = TokenProvider.generateRefreshToken();
    user.refreshToken = TokenProvider.hashRefreshToken(newRefreshToken);
    user.refreshTokenExpires = new Date(
      Date.now() + TokenProvider.REFRESH_TOKEN_EXPIRY
    );
    await user.save();

    return res
      .cookie('access_token', newAccessToken, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: TokenProvider.ACCESS_TOKEN_EXPIRY,
      })
      .cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: TokenProvider.REFRESH_TOKEN_EXPIRY,
      })
      .status(200)
      .json({ message: 'Token refreshed successfully' });
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * ! GET Get All Users
 *
 * @async
 * @returns {JSON} Responds with a list of all users in JSON format.
 * @throws {500} If an error occurs whilst fetching users from the database.
 */
router.get('/', verifyAdmin, async function (req, res) {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Get all users from the database'

  try {
    // Find all users
    const users = await User.find({});

    // Response 200 with list of users in json
    return res.status(200).json(users);
  } catch (error) {
    // Handle general errors
    return res.status(500).json({
      error: `An error occured while getting all Users: ${getErrorMessage(error)}`,
    });
  }
});

/**
 * ! DELETE Remove a User from the database
 *
 * @async
 * @returns {JSON} Responds with a success message in JSON
 * @throws {403} If user is not authorised to delete this account
 * @throws {500} If an error occurs
 * @throws {404} User not found error
 */
router.delete('/delete/:userId', verifyToken, async function (req, res) {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Delete a user from the database (Only admins or the user themselves can delete accounts)'

  try {
    if (!req.user) {
      return res.status(401).json({ error: 'You are not authenticated' });
    }

    // Get the requesting user from the token
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser)
      return res.status(404).json({ error: 'Requesting user not found' });

    // Get the target user by email
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser)
      return res.status(404).json({ error: 'Target user not found' });

    // Check authorisation
    const isSameUser =
      requestingUser._id.toString() === targetUser._id.toString();
    const isAdminDeletingOther = requestingUser.admin && !isSameUser;
    if (!isSameUser && !isAdminDeletingOther)
      return res
        .status(403)
        .json({ error: 'You are not authorised to delete this account' });

    // Delete the user
    await User.findOneAndDelete({ _id: targetUser._id });

    // Return status 200 for successful deletion of user
    return res.status(200).json({ message: 'User successfully deleted' });
  } catch (error) {
    // Handle general errors status 500
    return res.status(500).json({
      error: `Error occured while deleting user: ${getErrorMessage(error)}`,
    });
  }
});

/**
 * ! POST Logout a User
 *
 * @async
 * @returns {JSON} Responds with a success message in JSON
 * @throws {500} If an error occurs during logout
 */
router.post('/logout', verifyToken, async function (req, res) {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Clear the token cookies and invalidate refresh token in database'

  try {
    if (!req.user) {
      return res.status(401).json({ error: 'You are not authenticated' });
    }

    // Invalidate refresh token in database to prevent token reuse
    await User.findByIdAndUpdate(req.user.id, {
      $unset: { refreshToken: 1, refreshTokenExpires: 1 },
    });

    // Clear cookies
    res.clearCookie('access_token', { httpOnly: true, sameSite: 'strict' });
    res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'strict' });

    // Respond with success message
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    // Handle errors
    return res.status(500).json({
      error: `An error occurred during logout: ${getErrorMessage(error)}`,
    });
  }
});

/**
 * ! PUT Update a User's details
 *
 * @async
 * @param {String} userId - The ID of the user to update
 * @returns {JSON} Responds with status 200 and success message
 * @throws {404} If the Unit is not found
 * @throws {403} If the user is not authorised to update this account
 * @throws {400} If no update fields are provided
 * @throws {500} If some error occurs
 */
router.put('/update/:userId', verifyToken, async function (req, res) {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Update user\'s username and/or password (Only admins or the user themselves can update account details)'

  try {
    if (!req.user) {
      return res.status(401).json({ error: 'You are not authenticated' });
    }

    // Get the requesting user from the token
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser)
      return res.status(404).json({ error: 'Requesting user not found' });

    // Get the target user by userID
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser)
      return res.status(404).json({ error: 'Target user not found' });

    // Check authorisation
    const isSameUser =
      requestingUser._id.toString() === targetUser._id.toString();
    const isAdminUpdatingOther = requestingUser.admin && !isSameUser;
    if (!isSameUser && !isAdminUpdatingOther)
      return res
        .status(403)
        .json({ error: 'You are not authorised to update user details' });

    // Get the updated email and/or password from the request body
    const { username, password } = req.body;

    // Validate that either username or password is provided
    if (!username && !password)
      return res
        .status(400)
        .json({ error: 'Either username or password is required to update' });

    // Update fields if provided
    if (username) {
      targetUser.username = username;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      targetUser.password = hashedPassword;
    }

    // Save the updated user
    await targetUser.save();

    // Return status 200 sending success message and updated user data
    return res.status(200).json({
      message: 'User details successfully updated',
      username: targetUser.username,
    });
  } catch (error) {
    // Handle general errors status 500
    return res.status(500).json({
      error: `Error updating user details: ${getErrorMessage(error)}`,
    });
  }
});

/**
 * ! GET Validates User
 *
 * @async
 * @returns {JSON} Responds with status 200 and json containing message and decoded user data.
 * @throws {401} If the user is not authenticated and has no access token
 * @throws {403} If the given access_token is invalid
 * @throws {404} If the user is not found
 */
router.get('/validate', async function (req, res) {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Check if the user has the access_token in their cookies to keep session'

  // Gets the access token from the user's cookies
  const token = req.cookies.access_token;

  // Throw error if no access token
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  try {
    // Decode the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenPayload;

    // Find and store the user without storing the password
    const user = await User.findById(
      decoded.id,
      'email username isGoogleUser reviews admin profileImg likedReviews dislikedReviews notifications'
    );
    // User not found error case
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Return status 200 success with decoded user data
    return res.status(200).json({ message: 'Authenticated', data: user });
  } catch (err) {
    console.error('Invalid token:', err);
    return res.status(403).json({ message: 'Invalid token' });
  }
});

/**
 * ! POST Upload Avatar
 *
 * @async
 * @returns {JSON} Responds with status 200 and json containing the success message and profileImg URL
 * @throws {404} If the user is not found
 * @throws {500} Internal server errors
 */
router.post(
  '/upload-avatar',
  verifyToken,
  upload.single('avatar'),
  async function (req, res) {
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Upload the given avatar to cloudinary and assign it as user\'s profileImg'

    try {
      // Get the user by email
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) return res.status(404).json({ error: 'User not found' });

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // If the user already has a profile image, remove it from Cloudinary
      if (user.profileImg) {
        // Extract the public id from the existing cloudinary URL
        const urlParts = user.profileImg.split('/');
        const fileName = urlParts[urlParts.length - 1].split('.')[0]; // Extract the file name without its extension.
        const publicId = `user_avatars/${fileName}`;

        // Delete the old avatar
        await cloudinary.uploader.destroy(publicId);
      }

      // Save the Cloudinary URL as the user's avatar
      user.profileImg = req.file.path; // Cloudinary URL for the uploaded image
      await user.save();

      // Respond with status 200 and json containing success message and profile image
      return res.status(200).json({
        message: 'Avatar uploaded successfully',
        profileImg: user.profileImg,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ error: `Error uploading avatar: ${getErrorMessage(error)}` });
    }
  }
);

export default router;
