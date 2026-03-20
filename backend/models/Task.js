const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title:          { type: String, required: true, trim: true },
    description:    { type: String, default: "" },
    projectId:      { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true },
    assignedTo:     { type: mongoose.Schema.Types.ObjectId, ref: "Employee", index: true },
    assignedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status:         { type: String, enum: ["Assigned", "Todo", "In Progress", "Review", "Done", "Completed", "Pending"], default: "Todo", index: true },
    priority:       { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    startDate:      { type: Date },
    dueDate:        { type: Date },
    completedAt:    { type: Date },
    estimatedHours: { type: Number, default: 0, min: 0 },
    loggedHours:    { type: Number, default: 0, min: 0 },
    tags:           [{ type: String, trim: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
