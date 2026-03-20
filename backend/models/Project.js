const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    client:      { type: String, default: "" },
    status:      { type: String, enum: ["Planning", "Ongoing", "In Progress", "On Hold", "Completed", "Cancelled"], default: "Planning", index: true },
    priority:    { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
    startDate:   { type: Date },
    deadline:    { type: Date },
    completedAt: { type: Date },
    budget:      { type: Number, default: 0, min: 0 },
    spent:       { type: Number, default: 0, min: 0 },
    manager:     { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    tags:        [{ type: String, trim: true }],
    progress:    { type: Number, default: 0, min: 0, max: 100 },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
