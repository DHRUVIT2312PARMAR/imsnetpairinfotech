const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    employeeId:     { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    employeeName:   { type: String, required: true },
    type:           { type: String, enum: ["Annual", "Sick", "Casual", "Emergency", "Paid"], required: true, index: true },
    fromDate:       { type: String, required: true },
    toDate:         { type: String, required: true },
    days:           { type: Number, required: true, min: 1 },
    reason:         { type: String, default: "" },
    status:         { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending", index: true },
    approvedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt:     { type: Date },
    rejectedReason: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Leave", leaveSchema);
