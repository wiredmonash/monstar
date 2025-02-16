// Module imports
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { storage, cloudinary } = require('../utils/cloudinary');
const multer = require('multer');
const upload = multer({ storage });
const { verifyToken } = require('../utils/verify_token.js');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

// Model imports
const User = require('../models/user');

// Router instance
const router = express.Router();

// Google OAuth client instance
const client = new OAuth2Client();

// Function to send the verification email
async function sendVerificationEmail (email, verificationUrl) {
    // Transport settings
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // Email content
    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: 'Verify your email',
        html: `
        <p>Please click the following link to verify your email:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        `
    };

    // Send the email
    await transporter.sendMail(mailOptions);
}

/**
 * ! POST Create a User
 * 
 * Creates a new User and adds it to the database.
 * 
 * @async
 * @returns {JSON} Responds with the created unit in JSON format
 * @throws {500} If an error occurs whilst creating a unit
 */
router.post('/register', async function (req, res) {
    try {
        // Get values from json request
        const { email, password } = req.body;

        // Validate Monash student email format
        const emailRegex = /^[a-zA-Z]{4}\d{4}@student\.monash\.edu$/;
        if (!emailRegex.test(email)) return res.status(403).json({ error: 'Not a Monash email' });

        // Find and check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists/email exists" });
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Set the expiration time for the verification token (24 hours from now)
        const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;

        // Create and save new user
        const newUser = new User({ email, password: hashedPassword, verificationToken, verificationTokenExpires });
        await newUser.save();

        // Send the verification email
        const verificationUrl = `${process.env.FRONTEND_URL}/#/verify-email/${verificationToken}`;
        await sendVerificationEmail(email, verificationUrl);

        // Return status 201 for succesfull creation of a new user
        return res.status(201).json({ message: "User successfully registered" });
    }
    catch (error) {
        // Handle general errors
        return res.status(500).json({ error: `An error occured while created the User: ${error.message}` });
    }
});


/**
 * ! POST Login and/or register a User using Google
 * 
 * Login and/or register  a Google user
 * 
 * @async
 * @returns {200} Responds with 200 status code if user is successfully registered/logged in
 * @throws {409} If the user already exists as a non-Google account
 * @throws {403} If the email is not a Monash Student email
 * @throws {500} If an error occurs whilst registering a user
 */
router.post('/google/authenticate', async function (req, res) {
    const { idToken } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        // sub is the unique Google ID assigned to the user
        const { email, name, picture, sub } = payload;

        // Regular expression to validate authcate and email
        const emailRegex = /^[a-zA-Z]{4}\d{4}@student\.monash\.edu$/

        if (!emailRegex.test(email)) {
            return res.status(403).json({
                status: 403,
                message: 'Access denied: Only students with a valid Monash University email can log in.'
            });         
        }

        // Check if the user already exists
        let user = await User.findOne({
            $or: [
                { email: email },
                { googleID: sub }
            ]
        });

        const authcate = email.split('@')[0];

        // register the user if they aren't registered
        if (!user) {
            user = new User({
                email: email,
                username: authcate,
                profileImg: picture,
                isGoogleUser: true,
                googleID: sub,
                verified: true
            });
            await user.save();
        }

        // if there is a user but they are NOT a Google user but same email
        // (if they signed up using traditional way but then try logging in thru Google)
        if (!user.isGoogleUser) {
            return res.status(409).json({
                status: 409,
                message: "Account already exists as non-Google account."
            })
        }
        
        // Create json web token
        const token = jwt.sign(
            { id: user._id, isAdmin: user.admin },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Return response as cookie with access token and user data.
        return res.cookie('access_token', token, { 
                httpOnly: true,
                sameSite: 'strict'
            })
            .status(200)
            .json({
                status: 200,
                message: 'Login successful',
                data: user
            });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
})

/**
 * ! GET Verify Email
 * 
 * Endpoint that verifies the token when the user clicks the link in their mail.
 * 
 * @async
 * @returns {JSON} Responds with 200 and success message
 * @throws {400} If invalid or expired verification token
 * @throws {500} General errors
 */
router.get('/verify-email/:token', async function (req, res) {
    try {
        // Get the verification token
        const { token } = req.params;

        // Find the user with the verification token
        const user = await User.findOne({ verificationToken: token });
        if (!user)
            return res.status(400).json({ error: 'Invalid or expired verification token' });

        // Check if the verification token has expired
        if (user.verificationTokenExpires < Date.now())
            return res.status(400).json({ error: 'Verification token has expired' });

        // Mark the user as verified and remove the token
        user.verified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        // Generate a new json web token
        const authToken = jwt.sign(
            { id: user._id, isAdmin: user.admin },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        )

        // Return cookie with success response and user data
        return res.cookie('access_token', authToken, {
            httpOnly: true,
            sameSite: 'strict'
        })
        .status(200)
        .json({
            status: 200,
            message: 'Email successfully verified & user logged in',
            data: user
        })
    }
    catch (error) {
        // Handle general errors
        return res.status(500).json({ error: error.message });
    }
});


/**
 * ! GET Get All Users
 * 
 * Gets all users from the database. 
 * 
 * @async
 * @returns {JSON} Responds with a list of all users in JSON format.
 * @throws {500} If an error occurs whilst fetching users from the database.
 */
router.get('/', verifyToken, async function (req, res) {
    try {
        // Find all users
        const users = await User.find({});

        // Response 200 with list of users in json
        return res.status(200).json(users);
    }
    catch (error) {
        // Handle general errors
        return res.status(500).json({ error: `An error occured while getting all Users: ${error.message}` });
    }
});


/**
 * ! POST Login/authenticate a User
 * 
 * - Checks a email and password against the database and logs the user in.
 * - Checks if the email is a Monash student email unless the user is an admin.
 * - Makes sure the user is verified before logging in. 
 * - Sends a verification email if the user is not verified.
 * - Rate limits the number of verification emails sent.
 * - Rate limits the time between verification email requests.
 * 
 * @async
 * @returns {JSON} Responds with the created unit in JSON format
 * @throws {404} When the user is not found
 * @throws {409} When user exists as Google account
 * @throws {401} When the password is incorrect
 * @throws {429} When the user has reached the daily limit of verification emails
 * @throws {429} When the user has requested a verification email within the cooldown period
 * @throws {403} When the user has not verified their email
 * @throws {403} When the user tries logging in with a non-Monash email
 * @throws {500} If an error occurs whilst creating a unit
 */
router.post('/login', async function (req, res) {
    try {
        // Get the email and password from the request body
        const { email, password } = req.body;   

        // Find the user by email from the DB
        const user = await User.findOne({ email: email });

        // If there is no user of that email in the DB return status 400
        if (!user)
            return res.status(404).json({ error: "User not found" });

        // If user exists as Google account
        if (user.isGoogleUser) {
            return res.status(409).json({ error: "User is a Google account"});
        }

        // Skip Monash email validation for admin users
        if (!user.admin) {
            // Regular expression to validate Monash student email
            const emailRegex = /^[a-zA-Z]{4}\d{4}@student\.monash\.edu$/;

            // Check if email is a valid Monash email
            if (!emailRegex.test(email))
                return res.status(403).json({ error: 'Not a Monash email' });
        }
        
        // Check if the passwords match
        const passwordMatch = await bcrypt.compare(password, user.password);

        // If they don't match we send status 401
        if (!passwordMatch) 
            return res.status(401).json({ error: "Invalid email or password" });

        // Check if the user has verified their email
        if (!user.verified) {
            const now = Date.now();
            const fiveMinutes = 30; // 5 minutes in milliseconds
            const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

            // Check if the user has reached the daily limit
            if (user.verificationEmailsSent >= 3 && (now - user.lastVerificationEmail) < oneDay) 
                return res.status(429).json({ error: 'You have reached the maximum number of verification emails for today. Please try again tomorrow.' });

            // Check if the cooldown period has passed
            if (user.lastVerificationEmail && (now - user.lastVerificationEmail) < fiveMinutes)
                return res.status(429).json({ error: 'Please wait a 5 minutes before requesting another verification email.' });

            // Generate a new verification token
            const verificationToken = crypto.randomBytes(32).toString('hex');

            // Set the expiration time for the verification token (24 hours from now)
            const verificationTokenExpires = now + 24 * 60 * 60 * 1000;

            // Update the user's verification token
            user.verificationToken = verificationToken;
            user.verificationTokenExpires = verificationTokenExpires;
            user.lastVerificationEmail = now;

            // Increment the number of verification emails sent
            if ((now - user.lastVerificationEmail) >= oneDay)
                user.verificationEmailsSent = 1; // Reset count if it's a new day
            else
                user.verificationEmailsSent += 1; // Increment count if it's the same

            // Save the user
            await user.save();

            // Send the verification email
            const verificationUrl = `${process.env.FRONTEND_URL}/#/verify-email/${verificationToken}`;
            await sendVerificationEmail(email, verificationUrl);
            
            // Respond with status 403 and error message 
            return res.status(403).json({ error: 'Email not verified' });
        }

        // Create json web token
        const token = jwt.sign(
            { id: user._id, isAdmin: user.admin },
            process.env.JWT_SECRET
        );

        // Return response as cookie with access token and user data.
        return res.cookie('access_token', token, { httpOnly: true, sameSite: 'strict' })
            .status(200)
            .json({ status: 200, message: 'Login successful', data: user });
    }
    catch (error) {
        // Handle general errors
        return res.status(500).json({ error: `An error occured during login: ${error.message}` });
    }
});


/**
 * ! DELETE Remove a User from the database
 * 
 * Deletes a User from the database. Only admins or the user themselves can
 * delete accounts.
 * 
 * @async
 * @returns {JSON} Responds with a success message in JSON
 * @throws {403} If user is not authorised to delete this account
 * @throws {500} If an error occurs
 * @throws {404} User not found error
 */
router.delete('/delete/:userId', verifyToken, async function (req, res) {
    try {
        // Get the requesting user from the token
        const requestingUser = await User.findById(req.user.id);
        if (!requestingUser) return res.status(404).json({ error: 'Requesting user not found' });

        // Get the target user by email
        const targetUser = await User.findById(req.params.userId);
        if (!targetUser) return res.status(404).json({ error: 'Target user not found' });

        // Check authorisation
        const isSameUser = requestingUser._id.toString() === targetUser._id.toString();
        const isAdminDeletingOther = requestingUser.admin && !isSameUser;
        if (!isSameUser && !isAdminDeletingOther)
            return res.status(403).json({ error: 'You are not authorised to delete this account' });

        // Delete the user
        await User.findOneAndDelete({ _id: targetUser._id });

        // Return status 200 for successful deletion of user
        return res.status(200).json({ message: "User successfully deleted" });
    }
    catch (error) {
        // Handle general errors status 500
        return res.status(500).json({ error: `Error occured while deleting user: ${error.message}` });
    }
});

/**
 * ! POST Logout a User
 * 
 * Clears the token cookie to log the user out
 * 
 * @async
 * @returns {JSON} Responds with a success message in JSON
 */
router.post('/logout', verifyToken, async function (req, res) {
    try {
        // Clear the cookie
        res.clearCookie('access_token', { httpOnly: true, sameSite: 'strict' });

        // Respond with success message
        return res.status(200).json({ message: 'Logged out successfully' });
    }
    catch (error) {
        // Handle errors
        return res.status(500).json({ error: `An error occurred during logout: ${error.message}` });
    }
});

/**
 * ! POST Forgot Password
 * 
 * Sends a password reset email to the user
 * 
 * @async
 * @returns {JSON} Responds with a success message in JSON
 * @throws {404} If the user is not found
 * @throws {500} If an error occurs
 */
router.post('/forgot-password', async function (req, res) { 
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ error: 'User not found' });

        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000; // 24 hours
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes

        // Check if user has reached the daily limit (3 emails per day)
        if (user.resetPasswordEmailsSent >= 3 && (now - user.lastResetPasswordEmail) < oneDay)
            return res.status(429).json({ error: 'You have reached the maximum number of password reset emails for today. Please try again tomorrow.' });

        // Check if user is trying within 5 minutes of last attempt
        if (user.lastResetPasswordEmail && (now - user.lastResetPasswordEmail) < fiveMinutes)
            return res.status(429).json({ error: 'Please wait 5 minutes before requesting another password reset email.' });

        // Generate the reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = Date.now() + 3600000; // 1 hour

        // Update user token, expiration and last email sent.
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpires;
        user.lastResetPasswordEmail = now;

        // Reset counter if it's a new day, otherwise increment
        if ((now - user.lastResetPasswordEmail) >= oneDay) {
            user.resetPasswordEmailsSent = 1;
        } else {
            user.resetPasswordEmailsSent++; 
        }

        // Save the updated user
        await user.save();

        // Send reset email
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <p>Please click the following link to reset your password:</p>
                <a href="${resetUrl}">RESET PASSWORD</a>
                <p>This link will expire in 1 hour.</p>
            `
        });
        
        return res.status(200).json({ message: 'Password reset email sent' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Error whilst sending password reset email'});
    }
});

/**
 * ! POST Reset Password
 * 
 * Resets the user's password
 * 
 * @async
 * @returns {JSON} Responds with a success message in JSON
 * @throws {400} If the token is invalid or expired or matching user not found
 * @throws {500} If an error occurs
 */
router.post('/reset-password/:token', async function (req, res) {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Find user with valid reset token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ error: 'Invalid or expired password reset token' });

        // Hash new password and save
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return res.status(200).json({ message: 'Password has been reset', data: { email: user.email } });
    }
    catch (error) {
        return res.status(500).json({ error: `Error whilst resetting password: ${error.message}` });
    }
});

/**
 * ! PUT Update a User's details
 *  
 * Updates User's username and/or password. Only admins or the user themselves
 * can update account details.
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
    try {
        // Get the requesting user from the token
        const requestingUser = await User.findById(req.user.id);
        if (!requestingUser) return res.status(404).json({ error: 'Requesting user not found' });

        // Get the target user by userID
        const targetUser = await User.findById(req.params.userId);
        if (!targetUser) return res.status(404).json({ error: 'Target user not found' });

        // Check authorisation
        const isSameUser = requestingUser._id.toString() === targetUser._id.toString();
        const isAdminUpdatingOther = requestingUser.admin && !isSameUser;
        if (!isSameUser && !isAdminUpdatingOther)
            return res.status(403).json({ error: 'You are not authorised to update user details' });

        // Get the updated email and/or password from the request body
        const { username, password } = req.body;

        // Validate that either username or password is provided
        if (!username && !password)
            return res.status(400).json({ error: 'Either username or password is required to update' });

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
        return res.status(200).json({ message: "User details successfully updated",  username: targetUser.username });
    }
    catch (error) {
        // Handle general errors status 500
        return res.status(500).json({ error: `Error updating user details: ${error.message}` });
    }
});

/**
 * ! GET Validates User
 * 
 * Checks if the user has the access_token in their cookies to keep session.
 * The payload also contains the user's data.
 * 
 * @async
 * @returns {JSON} Responds with status 200 and json containing message and decoded user data.
 * @throws {401} If the user is not authenticated and has no access token
 * @throws {403} If the given access_token is invalid
 * @throws {404} If the user is not found
 */
router.get('/validate', async function (req, res) {
    // Gets the access token from the user's cookies
    const token = req.cookies.access_token;

    // Throw error if no access token
    if (!token)
        return res.status(401).json({ message: 'Not authenticated' });

    try {
        // Decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find and store the user without storing the password
        const user = await User.findById(decoded.id, 'email username isGoogleUser reviews admin profileImg likedReviews dislikedReviews');

        // User not found error case
        if (!user)
            return res.status(404).json({ message: 'User not found' });

        // Return status 200 success with decoded user data
        return res.status(200).json({ message: 'Authenticated', data: user });
    }
    catch (error) {
        // Invalid access token error
        return res.status(403).json({ message: 'Invalid token' });
    }
});

/**
 * ! POST Upload Avatar
 * 
 * Uploads the given avatar to cloudinary via middlware, and then assigns the 
 * avatar as user's profileImg
 * 
 * @async
 * @returns {JSON} Responds with status 200 and json containing the success message and profileImg URL
 * @throws {404} If the user is not found
 * @throws {500} Internal server errors
 */
router.post('/upload-avatar', verifyToken, upload.single('avatar'), async function (req, res) {
    try {
        // Get the user by email
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user)
            return res.status(404).json({ error: 'User not found' });

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
        return res.status(200).json({ message: 'Avatar uploaded successfully', profileImg: user.profileImg });
    }
    catch (error) { 
        return res.status(500).json({ error: `Error uploading avatar: ${error.message}` });
    }  
});


module.exports = router;