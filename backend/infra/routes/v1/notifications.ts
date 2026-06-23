// Module Imports
import express from 'express';
import { Types } from 'mongoose';

// Model Imports
import Notification from '@models/notification';
import User from '@models/user';
import { getErrorMessage } from '@utilities/getErrorMessage';
import { verifyToken } from '@utilities/verifyToken';

// Function Imports

// Router instance
const router = express.Router();

/**
 * ! GET Get All Notifications by User
 *
 * @async
 * @returns {JSON} Responds with a list of all user notifications in JSON format.
 * @throws {500} If an error occurs whilst fetching notifications from the database.
 * @throws {404} If the user is not found in the database.
 */
router.get('/user/:userId', verifyToken, async function (req, res) {
  // #swagger.tags = ['Notifications']
  // #swagger.summary = 'Get all notifications for a user from the database'

  try {
    const userId = req.params.userId;

    if (!req.user) {
      return res.status(401).json({ error: 'You are not authenticated' });
    }

    // Check if the authenticated user is requesting their own notifications
    if (req.user.id !== userId) {
      return res
        .status(403)
        .json({ error: 'Unauthorized to view these notifications' });
    }

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
    console.error(`An error occurred: ${getErrorMessage(error)}`);
    return res.status(500).json({
      error: `An error occurred while fetching notificatons: ${getErrorMessage(error)}`,
    });
  }
});

/**
 * ! DELETE Delete a notification
 *
 * @async
 * @returns {JSON} Responds with the deleted notification in JSON format
 * @throws {500} If an error occurs whilst deleting the notification.
 */
router.delete('/:notificationId', verifyToken, async function (req, res) {
  // #swagger.tags = ['Notifications']
  // #swagger.summary = 'Delete a user notification'

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

    if (!req.user) {
      return res.status(401).json({ error: 'You are not authenticated' });
    }

    console.log('checking if current user is owner');
    if (req.user.id != user._id.toString())
      return res
        .status(404)
        .json({ error: 'No permissions to remove notification' });

    // Delete the notification from the User's notifications array
    (user.notifications as Types.Array<Types.ObjectId>).pull(notification._id);
    // console.log("user updated");

    // Delete the notification from the database
    await Notification.deleteOne({ _id: notification._id });
    // console.log("notification deleted");

    // Save the user
    await user.save();

    // Respond 200 and json with success message
    res.status(200).json({ message: 'Notification successfully deleted' });
  } catch (error) {
    // Respond 500 and error message
    res.status(500).json({
      error: `Error while deleting notification: ${getErrorMessage(error)}`,
    });
  }
});

// Export the router
export = router;
