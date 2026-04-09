const Policy   = require("../models/Policy");
const Employee = require("../models/Employee");
const paginate = require("../utils/paginate");

const respond = (res, status, message, data = null) =>
  res.status(status).json({ success: status < 400, message, data, error: status >= 400 ? message : null });

exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    const result = await paginate(Policy, filter, req.query, { defaultSort: "createdAt" });
    const records = (result.data || []).map(p => ({
      ...p.toObject(),
      acknowledged: p.acknowledgedBy?.length || 0,
    }));
    respond(res, 200, "Policies fetched", { records, pagination: result.pagination });
  } catch (err) {
    console.error("[policyController.getAll]", err.message);
    respond(res, 500, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const { title, category, desc } = req.body;
    if (!title) return respond(res, 400, "Title is required");
    const empCount = await Employee.countDocuments({ status: "active" });
    const doc = await Policy.create({ title, category, desc, updatedBy: req.user._id, totalEmployees: empCount });
    respond(res, 201, "Policy created", { ...doc.toObject(), acknowledged: 0 });
  } catch (err) { respond(res, 500, err.message); }
};

exports.update = async (req, res) => {
  try {
    const doc = await Policy.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true }
    );
    if (!doc) return respond(res, 404, "Not found");
    respond(res, 200, "Updated", { ...doc.toObject(), acknowledged: doc.acknowledgedBy?.length || 0 });
  } catch (err) { respond(res, 500, err.message); }
};

exports.remove = async (req, res) => {
  try {
    await Policy.findByIdAndDelete(req.params.id);
    respond(res, 200, "Deleted");
  } catch (err) { respond(res, 500, err.message); }
};

exports.acknowledge = async (req, res) => {
  try {
    const doc = await Policy.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { acknowledgedBy: req.user._id } },
      { new: true }
    );
    if (!doc) return respond(res, 404, "Not found");
    respond(res, 200, "Acknowledged", { acknowledged: doc.acknowledgedBy.length });
  } catch (err) { respond(res, 500, err.message); }
};
