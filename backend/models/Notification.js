const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type:    { type: String, enum: ["leave","attendance","task","payroll","policy","system","announcement","Leave","Attendance","Task","Payroll","System","Announcement"], default: "system" },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    isRead:  { type: Boolean, default: false, index: true },
    link:    { type: String, default: "" },
    metadata: { type: Object },
  },
  { timestamps: true }
);

// Auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model("Notification", notificationSchema);
