const AuditLog = require("../models/AuditLog");
const paginate = require("../utils/paginate");

const respond = (res, status, message, data = null) =>
  res.status(status).json({ success: status < 400, message, data, error: status >= 400 ? message : null });

exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.module) filter.module = req.query.module;
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to)   filter.createdAt.$lte = new Date(req.query.to + "T23:59:59");
    }
    const result = await paginate(AuditLog, filter, req.query, { defaultSort: "createdAt" });
    respond(res, 200, "Audit logs fetched", result);
  } catch (err) { respond(res, 500, err.message); }
};

// Utility — called internally from other controllers
exports.log = async (userId, userName, action, module, detail, ip = "") => {
  try {
    await AuditLog.create({ userId, userName, action, module, detail, ip });
  } catch { /* silent — never break main flow */ }
};
