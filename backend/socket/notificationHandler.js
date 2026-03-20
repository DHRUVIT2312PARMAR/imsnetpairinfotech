const Notification = require("../models/Notification");

let io;

const init = (socketIo) => {
  io = socketIo;

  io.on("connection", (socket) => {
    // Client joins their personal room by userId
    socket.on("join", (userId) => {
      if (userId) socket.join(userId);
    });

    socket.on("disconnect", () => {});
  });
};

// Emit a notification to a specific user and persist to DB
const sendNotification = async (userId, { type, title, desc }) => {
  try {
    const notif = await Notification.create({ userId, type, title, desc });
    if (io) {
      io.to(String(userId)).emit("notification:new", {
        id:    notif._id,
        type:  notif.type,
        title: notif.title,
        desc:  notif.desc,
        read:  false,
        time:  "Just now",
      });
    }
  } catch (err) {
    // Non-critical — don't crash the request
  }
};

module.exports = { init, sendNotification };
