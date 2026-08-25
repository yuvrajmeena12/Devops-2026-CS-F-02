const Notification = require('../models/Notification');

/**
 * Creates an in-app notification for a user.
 * Called from other controllers whenever a notify-worthy event happens.
 */
const createNotification = async (userId, type, message, relatedId = null) => {
  try {
    await Notification.create({ user: userId, type, message, relatedId });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

module.exports = { createNotification };
