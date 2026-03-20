const mongoose = require("mongoose");

const wfhRequestSchema = new mongoose.Schema(
  {
    employeeId:   { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    employeeName: { type: String, required: true },
    date:         { type: String, required: true }, // "YYYY-MM-DD"
    reason:       { type: String, default: "" },
    status:       { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending", index: true },
    approvedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt:   { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WFHRequest", wfhRequestSchema);
