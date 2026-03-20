const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title:     { type: String, required: true, trim: true },
    msg:       { type: String, required: true },
    category:  { type: String, enum: ["General", "HR", "IT", "Event"], default: "General", index: true },
    pinned:    { type: Boolean, default: false, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
