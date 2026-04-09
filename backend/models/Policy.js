const mongoose = require("mongoose");

const policySchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    category:    { type: String, enum: ["HR","IT","Finance","General"], default: "General", index: true },
    desc:        { type: String, default: "" },
    updatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    acknowledgedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    totalEmployees: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Policy", policySchema);
