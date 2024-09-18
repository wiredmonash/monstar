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

        const user = User.findOne({ username });

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




module.exports = router;