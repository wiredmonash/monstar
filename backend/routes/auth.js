// Module imports
const express = require('express');
const bcrypt = require('bcrypt');


// Model imports
const User = require('../models/user');

// Router instance
const router = express.Router();

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
        const { username, password} = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({username});
        if (existingUser) {
            return res.status(400).json({error: "User already exists/Username exists"});
        }
        
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create and save new user
        const newUser = new User({
            username,
            password: hashedPassword
        });

        await newUser.save();

        return res.status(201).json({message: "User successfully registered"});
    }
    catch (error) {
        // Handle general errors
        return res.status(500).json({ error: `An error occured while created the User: ${error.message}` });
    }
});

/**
 * ! POST Login/authenticate a User
 * 
 * Checks a username and password against database entry
 * 
 * @async
 * @returns {JSON} Responds with the created unit in JSON format
 * @throws {500} If an error occurs whilst creating a unit
 */
router.post('/login', async function (req, res) {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(400).json({error: "Invalid username or password"});
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({error: "Invalid username or password"});
        }

        /*
        Currently a successful login just returns a 200 status but maybe in the
        future it should generate/assign a session token?
        */
        return res.status(200).json({message: "Login successful"});
    }
    catch (error) {
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
router.delete('/delete/:username', async function (req, res) {
    try {
        const user = await User.findOneAndDelete({username: req.params.username});

        if (!user) {
            return res.status(404).json({error: "User not found"});
        }

        return res.status(200).json({message: "User successfully deleted"});
    }
    catch (error) {
        return res.status(500).json({error: `Error occured while deleting user: ${error.message}`});
    }
});


/**
 * ! PUT Update a User's details
 *  
 * Updates User's username and/or password
 * 
 * @async
 * @returns {JSON} Responds with status 200 and success message
 * @throws {404} If the Unit is not found
 * @throws {500} If some error occurs
 */
router.put('/update/:username', async function (req, res) {
    try {
        const user = await User.findOne({username: req.params.username});
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }

        const { username, password} = req.body;

        if (username) {
            user.username = username;
        }

        if (password) {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            user.password = hashedPassword;
        }

        await user.save();

        return res.status(200).json({message: "User details successfully updated"});
    }
    catch (error) {
        return res.status(500).json({error: `Error updating user details: ${error.message}`});
    }
});


module.exports = router;