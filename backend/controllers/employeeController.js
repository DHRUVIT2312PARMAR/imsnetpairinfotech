const Employee = require("../models/Employee");
const paginate = require("../utils/paginate");

const respond = (res, status, message, data = null) =>
  res.status(status).json({ success: status < 400, message, data, error: status >= 400 ? message : null });

// GET /api/v1/employees
exports.getAllEmployees = async (req, res) => {
  try {
    const { search, department, status } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { firstName:  { $regex: search, $options: "i" } },
        { lastName:   { $regex: search, $options: "i" } },
        { email:      { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }
    if (department) filter.department = department;
    if (status)     filter.status     = status;

    const result = await paginate(Employee, filter, req.query, { defaultSort: "createdAt" });
    respond(res, 200, "Employees fetched", result);
  } catch (err) {
    respond(res, 500, err.message);
  }
};

// GET /api/v1/employees/stats
exports.getStats = async (req, res) => {
  try {
    const [total, active, inactive, terminated] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: "active" }),
      Employee.countDocuments({ status: "inactive" }),
      Employee.countDocuments({ status: "terminated" }),
    ]);
    respond(res, 200, "Stats fetched", { total, active, inactive, terminated });
  } catch (err) {
    respond(res, 500, err.message);
  }
};

// GET /api/v1/employees/:id
exports.getEmployee = async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return respond(res, 404, "Employee not found");
    respond(res, 200, "Employee fetched", emp);
  } catch (err) {
    respond(res, 500, err.message);
  }
};

// POST /api/v1/employees
exports.createEmployee = async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, address,
      department, designation, joiningDate, employmentType,
      gender, dateOfBirth, basicSalary, allowances, deductions,
      reportingManager,
    } = req.body;

    if (!firstName || !email || !department || !designation)
      return respond(res, 400, "firstName, email, department and designation are required");

    const emp = await Employee.create({
      firstName, lastName, email, phone, address,
      department, designation, joiningDate, employmentType,
      gender, dateOfBirth,
      basicSalary: basicSalary || 0,
      allowances:  allowances  || 0,
      deductions:  deductions  || 0,
      reportingManager,
    });
    respond(res, 201, "Employee created", emp);
  } catch (err) {
    if (err.code === 11000) return respond(res, 400, "Employee with this email already exists");
    respond(res, 500, err.message);
  }
};

// PUT /api/v1/employees/:id
exports.updateEmployee = async (req, res) => {
  try {
    const allowed = [
      "firstName","lastName","email","phone","address",
      "department","designation","employmentType","gender","dateOfBirth",
      "basicSalary","allowances","deductions","reportingManager",
      "status","statusReason","avatar",
    ];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const emp = await Employee.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!emp) return respond(res, 404, "Employee not found");
    respond(res, 200, "Employee updated", emp);
  } catch (err) {
    respond(res, 500, err.message);
  }
};

// DELETE /api/v1/employees/:id  (soft delete → terminated)
exports.deleteEmployee = async (req, res) => {
  try {
    const emp = await Employee.findByIdAndUpdate(
      req.params.id,
      { status: "terminated", statusUpdatedAt: new Date() },
      { new: true }
    );
    if (!emp) return respond(res, 404, "Employee not found");
    respond(res, 200, "Employee terminated", emp);
  } catch (err) {
    respond(res, 500, err.message);
  }
};
