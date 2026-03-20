const Notification = require("../models/Notification");

/**
 * Create a notification for a user.
 * @param {string} userId
 * @param {string} type  — leave | attendance | task | payroll | policy | system | announcement
 * @param {string} title
 * @param {string} message
 * @param {string} [link]  — optional frontend route e.g. '/leave'
 */
async function createNotification(userId, type, title, message, link = null) {
  try {
    await Notification.create({ userId, type, title, message, link });
  } catch (err) {
    console.error("[NOTIFY]", err.message);
  }
}

module.exports = { createNotification };
