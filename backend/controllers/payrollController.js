const Payroll  = require("../models/Payroll");
const Employee = require("../models/Employee");
const paginate = require("../utils/paginate");

const respond = (res, status, message, data = null) =>
  res.status(status).json({ success: status < 400, message, data, error: status >= 400 ? message : null });

exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.month)  filter.month  = parseInt(req.query.month);
    if (req.query.year)   filter.year   = parseInt(req.query.year);
    // Employee sees only own payslips
    if (req.user.role === "employee") {
      const emp = await Employee.findOne({ userId: req.user._id });
      if (emp) filter.employeeId = emp._id;
    }
    const result = await paginate(Payroll, filter, req.query, { defaultSort: "createdAt" });
    respond(res, 200, "Payroll fetched", result);
  } catch (err) { respond(res, 500, err.message); }
};

exports.generate = async (req, res) => {
  try {
    const { employeeId, month, year, basicSalary, allowances, overtime, bonus, deductions, tax, workingDays, presentDays, leaveDays } = req.body;
    if (!employeeId || !month || !year) return respond(res, 400, "employeeId, month and year are required");
    const emp = await Employee.findById(employeeId);
    if (!emp) return respond(res, 404, "Employee not found");
    const netSalary = (basicSalary||0) + (allowances||0) + (overtime||0) + (bonus||0) - (deductions||0) - (tax||0);
    const doc = await Payroll.findOneAndUpdate(
      { employeeId, month, year },
      {
        employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
        department: emp.department,
        basicSalary: basicSalary||0, allowances: allowances||0,
        overtime: overtime||0, bonus: bonus||0,
        deductions: deductions||0, tax: tax||0,
        netSalary, workingDays: workingDays||0,
        presentDays: presentDays||0, leaveDays: leaveDays||0,
        status: "Draft", processedBy: req.user._id,
      },
      { upsert: true, new: true }
    );
    respond(res, 201, "Payslip generated", doc);
  } catch (err) { respond(res, 500, err.message); }
};

exports.markPaid = async (req, res) => {
  try {
    const doc = await Payroll.findByIdAndUpdate(
      req.params.id,
      { status: "Paid", paidAt: new Date() },
      { new: true }
    );
    if (!doc) return respond(res, 404, "Not found");
    respond(res, 200, "Marked as paid", doc);
  } catch (err) { respond(res, 500, err.message); }
};
