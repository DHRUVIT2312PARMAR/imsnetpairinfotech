const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    employeeId:       { type: String, unique: true, index: true },
    userId:           { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    firstName:        { type: String, required: true, trim: true },
    lastName:         { type: String, trim: true, default: "" },
    dateOfBirth:      { type: Date },
    gender:           { type: String, enum: ["Male", "Female", "Other", ""], default: "" },
    avatar:           { type: String, default: "" },
    email:            { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone:            { type: String, default: "" },
    address:          { type: String, default: "" },
    department:       { type: String, required: true, trim: true, index: true },
    designation:      { type: String, required: true, trim: true },
    employmentType:   { type: String, enum: ["Full Time", "Part Time", "Intern", "Contract"], default: "Full Time" },
    joiningDate:      { type: Date, default: Date.now },
    reportingManager: { type: String, default: "" },
    basicSalary:      { type: Number, default: 0, min: 0 },
    allowances:       { type: Number, default: 0, min: 0 },
    deductions:       { type: Number, default: 0, min: 0 },
    status:           { type: String, enum: ["active", "inactive", "terminated"], default: "active", index: true },
    statusReason:     { type: String, default: "" },
    statusUpdatedAt:  { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

employeeSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

employeeSchema.virtual("netSalary").get(function () {
  return this.basicSalary + this.allowances - this.deductions;
});

employeeSchema.pre("save", async function () {
  if (this.isNew && !this.employeeId) {
    const count = await mongoose.model("Employee").countDocuments();
    this.employeeId = `NP-${String(count + 1).padStart(4, "0")}`;
  }
});

module.exports = mongoose.model("Employee", employeeSchema);
