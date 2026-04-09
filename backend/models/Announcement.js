const mongoose = require("mongoose");
const { ALL_ROLES } = require("../constants/roles");

const announcementSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true, maxlength: 255 },
    message:     { type: String, required: true },
    category:    { type: String, enum: ["General","HR","IT","Event"], default: "General", index: true },
    targetRoles: [{ type: String, enum: ALL_ROLES }],
    pinned:      { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: Date.now },
    expiresAt:   { type: Date, default: null },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDeleted:   { type: Boolean, default: false, index: true },
    deletedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedAt:   { type: Date },
    readBy:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
