const InventoryItem = require("../models/InventoryItem");
const paginate      = require("../utils/paginate");

const respond = (res, status, message, data = null) =>
  res.status(status).json({ success: status < 400, message, data, error: status >= 400 ? message : null });

exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category)   filter.category = req.query.category;
    if (req.query.stockFilter === "Low") filter.$expr = { $lte: ["$qty", "$minQty"] };
    const result = await paginate(InventoryItem, filter, req.query, { defaultSort: "name" });
    respond(res, 200, "Inventory fetched", result);
  } catch (err) { respond(res, 500, err.message); }
};

exports.create = async (req, res) => {
  try {
    const { name, category, qty, minQty, location, unit } = req.body;
    if (!name) return respond(res, 400, "Name is required");
    const doc = await InventoryItem.create({ name, category, qty: qty||0, minQty: minQty||0, location, unit });
    respond(res, 201, "Item added", doc);
  } catch (err) { respond(res, 500, err.message); }
};

exports.update = async (req, res) => {
  try {
    const doc = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return respond(res, 404, "Not found");
    respond(res, 200, "Updated", doc);
  } catch (err) { respond(res, 500, err.message); }
};

exports.stockIn = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return respond(res, 400, "Amount must be positive");
    const doc = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      { $inc: { qty: +amount } },
      { new: true }
    );
    if (!doc) return respond(res, 404, "Not found");
    respond(res, 200, "Stock updated", doc);
  } catch (err) { respond(res, 500, err.message); }
};

exports.remove = async (req, res) => {
  try {
    await InventoryItem.findByIdAndDelete(req.params.id);
    respond(res, 200, "Deleted");
  } catch (err) { respond(res, 500, err.message); }
};
