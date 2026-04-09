const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    category: { type: String, enum: ["IT","Stationery","Hygiene","Pantry","Other"], default: "Other", index: true },
    qty:      { type: Number, default: 0, min: 0 },
    minQty:   { type: Number, default: 0, min: 0 },
    location: { type: String, default: "" },
    unit:     { type: String, default: "Pcs" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InventoryItem", inventorySchema);
