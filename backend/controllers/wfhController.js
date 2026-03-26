const WFHRequest = require("../models/WFHRequest");
const Employee   = require("../models/Employee");
const paginate   = require("../utils/paginate");

const respond = (res, status, message, data = null) =>
  res.status(status).json({ success: status < 400, message, data, error: status >= 400 ? message : null });

exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    // Employee sees only own requests
    if (req.user.role === "employee") {
      const emp = await Employee.findOne({ userId: req.user._id });
      if (emp) filter.employeeId = emp._id;
    }
    const result = await paginate(WFHRequest, filter, req.query, { defaultSort: "createdAt" });
    respond(res, 200, "WFH requests fetched", result);
  } catch (err) { respond(res, 500, err.message); }
};

exports.create = async (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date || !reason) return respond(res, 400, "Date and reason are required");
    const emp = await Employee.findOne({ userId: req.user._id });
    const doc = await WFHRequest.create({
      employeeId:   emp?._id || req.user._id,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}`.trim() : req.user.firstName,
      date, reason,
    });
    respond(res, 201, "WFH request submitted", doc);
  } catch (err) { respond(res, 500, err.message); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Approved","Rejected"].includes(status)) return respond(res, 400, "Invalid status");
    const doc = await WFHRequest.findByIdAndUpdate(
      req.params.id,
      { status, approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );
    if (!doc) return respond(res, 404, "Not found");
    respond(res, 200, `Request ${status}`, doc);
  } catch (err) { respond(res, 500, err.message); }
};
