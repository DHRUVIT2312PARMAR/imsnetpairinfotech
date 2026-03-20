const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketId:     { type: String, unique: true, index: true },
    employeeId:   { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    employeeName: { type: String, required: true },
    subject:      { type: String, required: true, trim: true },
    description:  { type: String, default: "" },
    category:     { type: String, enum: ["IT", "HR", "Admin", "Other"], default: "Other", index: true },
    priority:     { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    status:       { type: String, enum: ["Open", "In Progress", "Resolved", "Closed"], default: "Open", index: true },
    assignedTo:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt:   { type: Date },
    notes:        { type: String, default: "" },
  },
  { timestamps: true }
);

ticketSchema.pre("save", async function () {
  if (this.isNew && !this.ticketId) {
    const count = await mongoose.model("Ticket").countDocuments();
    this.ticketId = `TKT-${String(count + 1).padStart(4, "0")}`;
  }
});

module.exports = mongoose.model("Ticket", ticketSchema);
