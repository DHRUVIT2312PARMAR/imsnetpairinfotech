const Attendance = require("../models/Attendance");
const Leave      = require("../models/Leave");
const Employee   = require("../models/Employee");
const Task       = require("../models/Task");
const Asset      = require("../models/Asset");

const respond = (res, status, message, data = null) =>
  res.status(status).json({ success: status < 400, message, data, error: status >= 400 ? message : null });

// GET /api/v1/reports/summary — dashboard stat cards
exports.getSummary = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [totalEmp, presentToday, tasksCompleted, assetsAssigned] = await Promise.all([
      Employee.countDocuments({ status: "active" }),
      Attendance.countDocuments({ date: today, status: "Present" }),
      Task.countDocuments({ status: { $in: ["Done","Completed"] } }),
      Asset.countDocuments({ status: "Assigned" }),
    ]);
    respond(res, 200, "Summary fetched", { totalEmp, presentToday, tasksCompleted, assetsAssigned });
  } catch (err) { respond(res, 500, err.message); }
};

// GET /api/v1/reports/attendance-trend — last 6 months
exports.getAttendanceTrend = async (req, res) => {
  try {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d     = new Date();
      d.setMonth(d.getMonth() - i);
      const year  = d.getFullYear();
      const month = d.getMonth() + 1;
      const start = `${year}-${String(month).padStart(2,"0")}-01`;
      const end   = new Date(year, month, 0).toISOString().split("T")[0];
      const records = await Attendance.find({ date: { $gte: start, $lte: end } });
      result.push({
        month:   d.toLocaleString("default", { month: "short" }) + " '" + String(year).slice(2),
        Present: records.filter(r => r.status === "Present").length,
        Absent:  records.filter(r => r.status === "Absent").length,
        Late:    records.filter(r => r.isLate).length,
      });
    }
    respond(res, 200, "Attendance trend fetched", result);
  } catch (err) { respond(res, 500, err.message); }
};

// GET /api/v1/reports/leave-by-type
exports.getLeaveByType = async (req, res) => {
  try {
    const types = ["Annual","Sick","Casual","Emergency"];
    const result = await Promise.all(
      types.map(async t => ({
        name:  t,
        value: await Leave.countDocuments({ type: t, status: "Approved" }),
      }))
    );
    respond(res, 200, "Leave by type fetched", result);
  } catch (err) { respond(res, 500, err.message); }
};

// GET /api/v1/reports/attendance-records — filterable table
exports.getAttendanceRecords = async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = req.query.from;
      if (req.query.to)   filter.date.$lte = req.query.to;
    }
    const records = await Attendance.find(filter).sort({ date: -1 }).limit(100);
    respond(res, 200, "Records fetched", records);
  } catch (err) { respond(res, 500, err.message); }
};
