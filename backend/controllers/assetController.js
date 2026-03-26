const Asset    = require("../models/Asset");
const paginate = require("../utils/paginate");

const respond = (res, status, message, data = null) =>
  res.status(status).json({ success: status < 400, message, data, error: status >= 400 ? message : null });

exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    const result = await paginate(Asset, filter, req.query, { defaultSort: "createdAt" });
    respond(res, 200, "Assets fetched", result);
  } catch (err) { respond(res, 500, err.message); }
};

exports.create = async (req, res) => {
  try {
    const { name, category, description, serialNumber, purchaseDate, purchasePrice, warrantyUntil, condition, notes } = req.body;
    if (!name) return respond(res, 400, "Asset name is required");
    const doc = await Asset.create({ name, category, description, serialNumber, purchaseDate, purchasePrice, warrantyUntil, condition, notes });
    respond(res, 201, "Asset created", doc);
  } catch (err) { respond(res, 500, err.message); }
};

exports.update = async (req, res) => {
  try {
    const doc = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return respond(res, 404, "Not found");
    respond(res, 200, "Updated", doc);
  } catch (err) { respond(res, 500, err.message); }
};

exports.remove = async (req, res) => {
  try {
    await Asset.findByIdAndDelete(req.params.id);
    respond(res, 200, "Deleted");
  } catch (err) { respond(res, 500, err.message); }
};
