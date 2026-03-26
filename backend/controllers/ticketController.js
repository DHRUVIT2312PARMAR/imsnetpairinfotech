const Ticket   = require("../models/Ticket");
const Employee = require("../models/Employee");
const paginate = require("../utils/paginate");

const respond = (res, status, message, data = null) =>
  res.status(status).json({ success: status < 400, message, data, error: status >= 400 ? message : null });

exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    // Employee sees only own tickets
    if (req.user.role === "employee") {
      const emp = await Employee.findOne({ userId: req.user._id });
      if (emp) filter.employeeId = emp._id;
    }
    const result = await paginate(Ticket, filter, req.query, { defaultSort: "createdAt" });
    respond(res, 200, "Tickets fetched", result);
  } catch (err) { respond(res, 500, err.message); }
};

exports.create = async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;
    if (!subject) return respond(res, 400, "Subject is required");
    const emp = await Employee.findOne({ userId: req.user._id });
    const doc = await Ticket.create({
      employeeId:   emp?._id || req.user._id,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}`.trim() : req.user.firstName,
      subject, description, category, priority,
    });
    respond(res, 201, "Ticket created", doc);
  } catch (err) { respond(res, 500, err.message); }
};

exports.update = async (req, res) => {
  try {
    const doc = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return respond(res, 404, "Not found");
    respond(res, 200, "Updated", doc);
  } catch (err) { respond(res, 500, err.message); }
};
