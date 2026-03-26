const Announcement = require("../models/Announcement");
const paginate     = require("../utils/paginate");

const respond = (res, status, message, data = null) =>
  res.status(status).json({ success: status < 400, message, data, error: status >= 400 ? message : null });

exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    const result = await paginate(Announcement, filter, req.query, { defaultSort: "createdAt" });
    respond(res, 200, "Announcements fetched", result);
  } catch (err) { respond(res, 500, err.message); }
};

exports.create = async (req, res) => {
  try {
    const { title, msg, category, pinned } = req.body;
    if (!title || !msg) return respond(res, 400, "Title and message are required");
    const doc = await Announcement.create({ title, msg, category, pinned, createdBy: req.user._id });
    respond(res, 201, "Announcement created", doc);
  } catch (err) { respond(res, 500, err.message); }
};

exports.update = async (req, res) => {
  try {
    const doc = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return respond(res, 404, "Not found");
    respond(res, 200, "Updated", doc);
  } catch (err) { respond(res, 500, err.message); }
};

exports.remove = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    respond(res, 200, "Deleted");
  } catch (err) { respond(res, 500, err.message); }
};
