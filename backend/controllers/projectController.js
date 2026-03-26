const Project  = require("../models/Project");
const Employee = require("../models/Employee");
const paginate = require("../utils/paginate");

const respond = (res, status, message, data = null) =>
  res.status(status).json({ success: status < 400, message, data, error: status >= 400 ? message : null });

exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    // Employee sees only projects they are a member of
    if (req.user.role === "employee") {
      const emp = await Employee.findOne({ userId: req.user._id });
      if (emp) filter.$or = [{ manager: emp._id }, { teamMembers: emp._id }];
    }
    const result = await paginate(Project, filter, req.query, { defaultSort: "createdAt" });
    respond(res, 200, "Projects fetched", result);
  } catch (err) { respond(res, 500, err.message); }
};

exports.create = async (req, res) => {
  try {
    const { title, description, client, status, priority, startDate, deadline, budget, manager, teamMembers, tags } = req.body;
    if (!title) return respond(res, 400, "Title is required");
    const doc = await Project.create({ title, description, client, status, priority, startDate, deadline, budget, manager, teamMembers, tags, createdBy: req.user._id });
    respond(res, 201, "Project created", doc);
  } catch (err) { respond(res, 500, err.message); }
};

exports.update = async (req, res) => {
  try {
    const doc = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return respond(res, 404, "Not found");
    respond(res, 200, "Updated", doc);
  } catch (err) { respond(res, 500, err.message); }
};

exports.remove = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    respond(res, 200, "Deleted");
  } catch (err) { respond(res, 500, err.message); }
};
