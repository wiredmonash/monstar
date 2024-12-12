// Module imports
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

// Model imports
const User = require('../models/user');

// Router instance
const router = express.Router();

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

        // Find and check if user already exists
        const existingUser = await User.findOne({email});
        if (existingUser)
            return res.status(400).json({error: "User already exists/Email exists"});
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create and save new user
        const newUser = new User({ email, password: hashedPassword, verificationToken });
        await newUser.save();

        // Send the verification email
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
        await sendVerificationEmail(email, verificationUrl);

        // Return status 201 for succesfull creation of a new user
        return res.status(201).json({message: "User successfully registered"});
    }
    catch (error) {
        // Handle general errors
        return res.status(500).json({ error: `An error occured while created the User: ${error.message}` });
    }
});
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

        // Mark the user as verified and remove the token
        user.verified = true;
        user.verificationToken = undefined;
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
router.get('/', async function (req, res) {
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
 * Checks a email and password against database entry
 * 
 * @async
 * @returns {JSON} Responds with the created unit in JSON format
 * @throws {500} If an error occurs whilst creating a unit
 */
router.post('/login', async function (req, res) {
    try {
        // Get the email and password from the request body
        const { email, password } = req.body;   

        // Find the user by email from the DB
        const user = await User.findOne({ email });

        // If there is no user of that email in the DB return status 400
        if (!user)
            return res.status(400).json({error: "Invalid email or password"});

        // TODO: Login is restriced for users that haven't verified
        // TODO:

        // Check if the passwords match
        const passwordMatch = await bcrypt.compare(password, user.password);

        // If they don't match we send status 400
        if (!passwordMatch) 
            return res.status(400).json({error: "Invalid email or password"});

        // Create json web token
        const token = jwt.sign(
            { id: user._id, isAdmin: user.admin },
            process.env.JWT_SECRET
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
        // Handle general errors
        return res.status(500).json({error: `An error occured during login: ${error.message}`});
    }
});


/**
 * ! DELETE Remove a User from the database
 * 
 * Deletes a User from the database
 * 
 * @async
 * @returns {JSON} Responds with a success message in JSON
 * @throws {500} If an error occurs
 * @throws {404} User not found error
 */
router.delete('/delete/:email', async function (req, res) {
    try {
        // Get the user by email in the DB and delete them.
        const user = await User.findOneAndDelete({email: req.params.email});

        // If there is no user in the DB, return status 404 Not Found.
        if (!user)
            return res.status(404).json({ error: "User not found" });

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
router.post('/logout', async function (req, res) {
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
 * ! PUT Update a User's details
 *  
 * Updates User's email and/or password
 * 
 * @async
 * @returns {JSON} Responds with status 200 and success message
 * @throws {404} If the Unit is not found
 * @throws {500} If some error occurs
 */
router.put('/update/:email', async function (req, res) {
    try {
        // Get the user by email from the DB
        const user = await User.findOne({email: req.params.email});

        // If the user doesn't exist in the DB return status 404 not found
        if (!user)
            return res.status(404).json({error: "User not found"});

        // Get the updated email and/or password from the request body
        const { email, password } = req.body;

        // If email was provided in the request body, update it.
        if (email)
            user.email = email;

        // If password was provided in the request body, hash it and update it.
        if (password) {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            user.password = hashedPassword;
        }

        // Save the updates
        await user.save();

        // Return status 200 for successful update of user details
        return res.status(200).json({message: "User details successfully updated"});
    }
    catch (error) {
        // Handle general errors
        return res.status(500).json({error: `Error updating user details: ${error.message}`});
    }
});

/**
 * ! Validates User
 * 
 * Checks if the user has the access_token in their cookies to keep session.
 * The payload also contains the user's data.
 * 
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
        const user = await User.findById(decoded.id, 'email username reviews admin profileImg');

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


module.exports = router;