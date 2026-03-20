const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    assetId:       { type: String, unique: true, index: true },
    name:          { type: String, required: true, trim: true },
    category:      { type: String, enum: ["Laptop", "Mobile", "Monitor", "Keyboard", "Mouse", "Other"], default: "Other", index: true },
    description:   { type: String, default: "" },
    serialNumber:  { type: String, default: "" },
    purchaseDate:  { type: Date },
    purchasePrice: { type: Number, default: 0, min: 0 },
    warrantyUntil: { type: Date },
    status:        { type: String, enum: ["Available", "Assigned", "Under Repair", "Retired"], default: "Available", index: true },
    assignedTo:    { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    assignedAt:    { type: Date },
    returnedAt:    { type: Date },
    condition:     { type: String, enum: ["New", "Good", "Fair", "Poor"], default: "Good" },
    notes:         { type: String, default: "" },
  },
  { timestamps: true }
);

assetSchema.pre("save", async function () {
  if (this.isNew && !this.assetId) {
    const count = await mongoose.model("Asset").countDocuments();
    this.assetId = `AST-${String(count + 1).padStart(4, "0")}`;
  }
});

module.exports = mongoose.model("Asset", assetSchema);
