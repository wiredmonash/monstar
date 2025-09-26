// Module Imports
const express = require('express');

// Model Imports
const User = require('../models/user');
const Notification = require('../models/notification');

// Function Imports
const { verifyToken } = require('../utils/verify_token.js');

// Router instance
const router = express.Router();

/**
 * ! GET Get All Notifications by User
 *
 * Gets all notifications for a user from the datavase
 *
 * @async
 * @returns {JSON} Responds with a list of all user notifications in JSON format.
 * @throws {500} If an error occurs whilst fetching notifications from the database.
 * @throws {404} If the user is not found in the database.
 */
router.get('/user/:userId', async function (req, res) {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    // console.log(`Fetching notifications for user: ${user}`);

    // Find all notifications associated with this user
    const notifications = await Notification.find({ user });
    // console.log(`Found ${notifications.length} notifications`);
    // console.log({notifications})

    // Return the list of reviews with a 200 OK status
    return res.status(200).json(notifications);
  } catch (error) {
    // Handle any errors that occur during the process
    console.error(`An error occurred: ${error.message}`);
    return res
      .status(500)
      .json({
        error: `An error occurred while fetching notificatons: ${error.message}`,
      });
  }
});

/**
 * ! DELETE Delete a notification
 *
 * Deletes a user notification
 *
 * @async
 * @returns {JSON} Responds with the deleted notification in JSON format
 * @throws {500} If an error occurs whilst deleting the notification.
 */
router.delete('/:notificationId', verifyToken, async function (req, res) {
  try {
    console.log('deleting notification');
    const notificationId = req.params.notificationId;

    // Find the notification
    const notification = await Notification.findById(notificationId);

    if (!notification)
      return res.status(404).json({ error: 'Notification not found' });

    // Find the user
    const user = await User.findById(notification.user);

    if (!user) return res.status(404).json({ error: 'User not found' });

    console.log('checking if current user is owner');
    if (req.user.id != user._id.toString())
      return res
        .status(404)
        .json({ error: 'No permissions to remove notification' });

    // Delete the notification from the User's notifications array
    user.notifications.pull(notification._id);
    // console.log("user updated");

    // Delete the notification from the database
    await Notification.deleteOne(notification);
    // console.log("notification deleted");

    // Save the user
    await user.save();

    // Respond 200 and json with success message
    res.status(200).json({ message: 'Notification successfully deleted' });
  } catch (error) {
    // Respond 500 and error message
    res
      .status(500)
      .json({ error: `Error while deleting notification: ${error.message}` });
  }
});

// Export the router
module.exports = router;
