// Module imports
const express = require('express');

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



module.exports = router;