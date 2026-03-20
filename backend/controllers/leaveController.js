const Leave    = require("../models/Leave");
const Employee = require("../models/Employee");
const paginate = require("../utils/paginate");

const respond = (res, status, message, data = null) =>
  res.status(status).json({ success: status < 400, message, data, error: status >= 400 ? message : null });

// GET /api/v1/leaves
exports.getLeaves = async (req, res) => {
  try {
    const { status, type, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type)   filter.type   = type;
    if (search) filter.employeeName = { $regex: search, $options: "i" };

    const result = await paginate(Leave, filter, req.query, { defaultSort: "createdAt" });
    respond(res, 200, "Leaves fetched", result);
  } catch (err) {
    respond(res, 500, err.message);
  }
};

// POST /api/v1/leaves
exports.applyLeave = async (req, res) => {
  try {
    const { employeeId, employeeName, type, fromDate, toDate, reason } = req.body;
    if (!employeeName || !type || !fromDate || !toDate)
      return respond(res, 400, "employeeName, type, fromDate and toDate are required");

    const from = new Date(fromDate);
    const to   = new Date(toDate);
    if (to < from) return respond(res, 400, "toDate must be after fromDate");

    const days = Math.max(1, Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1);
    const leave = await Leave.create({ employeeId, employeeName, type, fromDate, toDate, days, reason });
    respond(res, 201, "Leave applied", leave);
  } catch (err) {
    respond(res, 500, err.message);
  }
};

// PUT /api/v1/leaves/:id/approve
exports.approveLeave = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: "Approved", approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );
    if (!leave) return respond(res, 404, "Leave not found");
    respond(res, 200, "Leave approved", leave);
  } catch (err) {
    respond(res, 500, err.message);
  }
};

// PUT /api/v1/leaves/:id/reject
exports.rejectLeave = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: "Rejected", approvedBy: req.user._id, approvedAt: new Date(), rejectedReason: req.body.reason || "" },
      { new: true }
    );
    if (!leave) return respond(res, 404, "Leave not found");
    respond(res, 200, "Leave rejected", leave);
  } catch (err) {
    respond(res, 500, err.message);
  }
};

// GET /api/v1/leaves/balance/:employeeId
exports.getBalance = async (req, res) => {
  try {
    const leaves = await Leave.find({ employeeId: req.params.employeeId, status: "Approved" });
    const balance = {
      Annual:    { used: 0, total: 12 },
      Sick:      { used: 0, total: 8  },
      Casual:    { used: 0, total: 6  },
      Emergency: { used: 0, total: 4  },
    };
    leaves.forEach(l => {
      if (balance[l.type]) balance[l.type].used += l.days;
    });
    respond(res, 200, "Balance fetched", balance);
  } catch (err) {
    respond(res, 500, err.message);
  }
};
