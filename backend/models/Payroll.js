const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    employeeId:   { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    employeeName: { type: String, required: true },
    department:   { type: String, default: "" },
    month:        { type: Number, required: true, min: 1, max: 12 },
    year:         { type: Number, required: true },
    basicSalary:  { type: Number, default: 0, min: 0 },
    allowances:   { type: Number, default: 0, min: 0 },
    overtime:     { type: Number, default: 0, min: 0 },
    bonus:        { type: Number, default: 0, min: 0 },
    deductions:   { type: Number, default: 0, min: 0 },
    tax:          { type: Number, default: 0, min: 0 },
    netSalary:    { type: Number, default: 0 },
    workingDays:  { type: Number, default: 0 },
    presentDays:  { type: Number, default: 0 },
    leaveDays:    { type: Number, default: 0 },
    status:       { type: String, enum: ["Draft", "Processed", "Paid"], default: "Draft", index: true },
    paidAt:       { type: Date },
    processedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Auto-calculate netSalary before save
payrollSchema.pre("save", function () {
  this.netSalary = this.basicSalary + this.allowances + this.overtime + this.bonus - this.deductions - this.tax;
});

// One payroll per employee per month/year
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Payroll", payrollSchema);
