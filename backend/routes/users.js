// Module Imports
const express = require('express');

// Model Imports
const User = require('../models/user');

// Function Imports
const { verifyAdmin } = require('../utils/verify_token.js');

// Router instance
const router = express.Router();

/**
 * ! GET Get User by Username
 * 
 * Gets a user by their username
 * 
 * @async
 * @returns {JSON} Responds with the unit and its details in JSON format
 * @throws {500} If an error occurs whilst getting the singular user from the database
 */
router.get('/:username', async function (req, res) {
    try {
        const user = await User.findOne({ username: req.params.username });

        if (!user) 
            return res.status(404).json({ error: 'User not found'});

        return res.status(200).json(user);
    }   
    catch (error) {
        return res.status(500).json({ error: `An error occured whilst getting the singular user: ${error.message}`});
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
        // Find all the users
        const users = await User.find({});

        // Respond 200 with JSON list containing all Users.
        return res.status(200).json(users);
    }
    catch (error) {
        // Handle general errors 500
        return res.status(500).json({ error: `An error occured while getting all Users: ${error.message}` });
    }
});


// Export the router
module.exports = router;