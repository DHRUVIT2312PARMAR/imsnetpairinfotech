const Task     = require("../models/Task");
const Employee = require("../models/Employee");
const paginate = require("../utils/paginate");

const respond = (res, status, message, data = null) =>
  res.status(status).json({ success: status < 400, message, data, error: status >= 400 ? message : null });

exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status)    filter.status    = req.query.status;
    if (req.query.projectId) filter.projectId = req.query.projectId;
    // Employee sees only own tasks
    if (req.user.role === "employee") {
      const emp = await Employee.findOne({ userId: req.user._id });
      if (emp) filter.assignedTo = emp._id;
    }
    const result = await paginate(Task, filter, req.query, { defaultSort: "createdAt" });
    respond(res, 200, "Tasks fetched", result);
  } catch (err) { respond(res, 500, err.message); }
};

exports.create = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, status, priority, startDate, dueDate, estimatedHours } = req.body;
    if (!title) return respond(res, 400, "Title is required");
    const doc = await Task.create({ title, description, projectId, assignedTo, status, priority, startDate, dueDate, estimatedHours, assignedBy: req.user._id });
    respond(res, 201, "Task created", doc);
  } catch (err) { respond(res, 500, err.message); }
};

exports.update = async (req, res) => {
  try {
    const doc = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return respond(res, 404, "Not found");
    respond(res, 200, "Updated", doc);
  } catch (err) { respond(res, 500, err.message); }
};

exports.remove = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    respond(res, 200, "Deleted");
  } catch (err) { respond(res, 500, err.message); }
};
