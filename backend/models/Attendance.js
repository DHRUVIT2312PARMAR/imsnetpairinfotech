const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employeeId:   { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    employeeName: { type: String, default: "" },
    department:   { type: String, default: "", index: true },
    date:         { type: String, required: true, index: true }, // "YYYY-MM-DD"
    checkIn:      { type: String, default: "-" },
    checkOut:     { type: String, default: "-" },
    workingHours: { type: Number, default: 0, min: 0 },
    status:       { type: String, enum: ["Present", "Absent", "Half Day", "WFH"], default: "Absent", index: true },
    mode:         { type: String, enum: ["Office", "WFH", "Hybrid", ""], default: "" },
    isLate:       { type: Boolean, default: false },
    lateMinutes:  { type: Number, default: 0, min: 0 },
    notes:        { type: String, default: "" },
    markedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// One record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
