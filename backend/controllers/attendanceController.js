const Attendance = require("../models/Attendance");
const Employee   = require("../models/Employee");
const paginate   = require("../utils/paginate");

const respond = (res, status, message, data = null) =>
  res.status(status).json({ success: status < 400, message, data, error: status >= 400 ? message : null });

const todayStr = () => new Date().toISOString().split("T")[0];

// GET /api/v1/attendance/records
exports.getRecords = async (req, res) => {
  try {
    const { date, department, status } = req.query;
    const filter = {};
    if (date)       filter.date       = date;
    if (department) filter.department = department;
    if (status)     filter.status     = status;

    const result = await paginate(Attendance, filter, req.query, { defaultSort: "date" });
    respond(res, 200, "Records fetched", result);
  } catch (err) {
    respond(res, 500, err.message);
  }
};

// GET /api/v1/attendance/today
exports.getToday = async (req, res) => {
  try {
    const records = await Attendance.find({ date: todayStr() });
    respond(res, 200, "Today fetched", {
      records,
      stats: {
        present:  records.filter(r => r.status === "Present").length,
        absent:   records.filter(r => r.status === "Absent").length,
        wfh:      records.filter(r => r.status === "WFH").length,
        halfDay:  records.filter(r => r.status === "Half Day").length,
        late:     records.filter(r => r.isLate).length,
      },
    });
  } catch (err) {
    respond(res, 500, err.message);
  }
};

// POST /api/v1/attendance/mark
exports.markAttendance = async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, mode, notes } = req.body;
    if (!employeeId || !date || !status)
      return respond(res, 400, "employeeId, date and status are required");

    const emp = await Employee.findById(employeeId);
    if (!emp) return respond(res, 404, "Employee not found");

    const isLate = !!(checkIn && checkIn > "09:00");
    const lateMinutes = isLate
      ? (() => { const [h, m] = checkIn.split(":").map(Number); return (h * 60 + m) - 540; })()
      : 0;

    // Calculate working hours if both times provided
    let workingHours = 0;
    if (checkIn && checkOut && checkIn !== "-" && checkOut !== "-") {
      const [ih, im] = checkIn.split(":").map(Number);
      const [oh, om] = checkOut.split(":").map(Number);
      workingHours = parseFloat(((oh * 60 + om - (ih * 60 + im)) / 60).toFixed(2));
    }

    const record = await Attendance.findOneAndUpdate(
      { employeeId, date },
      {
        employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
        department:   emp.department,
        checkIn:      checkIn  || "-",
        checkOut:     checkOut || "-",
        workingHours,
        status,
        mode:         mode  || "",
        notes:        notes || "",
        isLate,
        lateMinutes,
        markedBy:     req.user._id,
      },
      { upsert: true, new: true }
    );
    respond(res, 200, "Attendance marked", record);
  } catch (err) {
    respond(res, 500, err.message);
  }
};

// GET /api/v1/attendance/weekly-data
exports.getWeeklyData = async (req, res) => {
  try {
    const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const records = await Attendance.find({ date: dateStr });
      result.push({
        day:     days[d.getDay() === 0 ? 6 : d.getDay() - 1],
        date:    dateStr,
        Present: records.filter(r => r.status === "Present").length,
        Absent:  records.filter(r => r.status === "Absent").length,
        WFH:     records.filter(r => r.status === "WFH").length,
        Late:    records.filter(r => r.isLate).length,
      });
    }
    respond(res, 200, "Weekly data fetched", result);
  } catch (err) {
    respond(res, 500, err.message);
  }
};

// GET /api/v1/attendance/my-today  — employee's own today record
exports.getMyToday = async (req, res) => {
  try {
    const emp   = await Employee.findOne({ userId: req.user._id });
    const empId = emp ? emp._id : req.user._id;
    const record = await Attendance.findOne({ employeeId: empId, date: todayStr() });
    respond(res, 200, "Today record fetched", record || null);
  } catch (err) {
    respond(res, 500, err.message);
  }
};

// GET /api/v1/attendance/my-summary  — employee's current month summary
exports.getMySummary = async (req, res) => {
  try {
    const emp   = await Employee.findOne({ userId: req.user._id });
    const empId = emp ? emp._id : req.user._id;

    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const records = await Attendance.find({
      employeeId: empId,
      date: { $gte: start, $lte: end },
    });

    respond(res, 200, "Monthly summary fetched", {
      present:  records.filter(r => r.status === "Present").length,
      absent:   records.filter(r => r.status === "Absent").length,
      halfDay:  records.filter(r => r.status === "Half Day").length,
      wfh:      records.filter(r => r.status === "WFH").length,
      total:    records.length,
    });
  } catch (err) {
    respond(res, 500, err.message);
  }
};

// GET /api/v1/attendance/my-history  — employee's own history (paginated)
exports.getMyHistory = async (req, res) => {
  try {
    const emp   = await Employee.findOne({ userId: req.user._id });
    const empId = emp ? emp._id : req.user._id;

    const limit = parseInt(req.query.limit) || 20;
    const page  = parseInt(req.query.page)  || 1;

    const [records, total] = await Promise.all([
      Attendance.find({ employeeId: empId })
        .sort({ date: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      Attendance.countDocuments({ employeeId: empId }),
    ]);

    respond(res, 200, "History fetched", records);
  } catch (err) {
    respond(res, 500, err.message);
  }
};

// POST /api/v1/attendance/clock-in
exports.clockIn = async (req, res) => {
  try {
    const { mode } = req.body;
    const now  = new Date();
    const time = now.toTimeString().slice(0, 5); // "HH:MM"
    const date = now.toISOString().split("T")[0];

    // Find Employee record — fall back to User data if not found
    const emp = await Employee.findOne({ userId: req.user._id });
    const empId   = emp ? emp._id : req.user._id;
    const empName = emp
      ? `${emp.firstName} ${emp.lastName}`.trim()
      : `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() || req.user.systemEmail;
    const dept = emp?.department || "";

    const existing = await Attendance.findOne({ employeeId: empId, date });
    if (existing?.checkIn && existing.checkIn !== "-")
      return respond(res, 400, "Already clocked in today");

    const isLate = time > "09:00";
    const lateMinutes = isLate
      ? (() => { const [h, m] = time.split(":").map(Number); return (h * 60 + m) - 540; })()
      : 0;

    const modeMap = { office: "Office", home: "WFH", "client-site": "Office" };
    const savedMode = modeMap[mode] || "Office";

    const record = await Attendance.findOneAndUpdate(
      { employeeId: empId, date },
      {
        employeeName: empName,
        department:   dept,
        checkIn:      time,
        checkOut:     "-",
        status:       mode === "home" ? "WFH" : "Present",
        mode:         savedMode,
        isLate,
        lateMinutes,
        markedBy:     req.user._id,
      },
      { upsert: true, new: true }
    );
    respond(res, 200, "Clocked in", record);
  } catch (err) {
    respond(res, 500, err.message);
  }
};

// POST /api/v1/attendance/clock-out
exports.clockOut = async (req, res) => {
  try {
    const now  = new Date();
    const time = now.toTimeString().slice(0, 5);
    const date = now.toISOString().split("T")[0];

    const emp   = await Employee.findOne({ userId: req.user._id });
    const empId = emp ? emp._id : req.user._id;

    const record = await Attendance.findOne({ employeeId: empId, date });
    if (!record || !record.checkIn || record.checkIn === "-")
      return respond(res, 400, "You have not clocked in today");
    if (record.checkOut && record.checkOut !== "-")
      return respond(res, 400, "Already clocked out today");

    const [ih, im] = record.checkIn.split(":").map(Number);
    const [oh, om] = time.split(":").map(Number);
    const workingHours = parseFloat(((oh * 60 + om - (ih * 60 + im)) / 60).toFixed(2));

    const updated = await Attendance.findByIdAndUpdate(
      record._id,
      { checkOut: time, workingHours },
      { new: true }
    );
    respond(res, 200, "Clocked out", updated);
  } catch (err) {
    respond(res, 500, err.message);
  }
};

// POST /api/v1/attendance/regularization — employee requests correction
exports.regularization = async (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date || !reason) return respond(res, 400, "Date and reason are required");
    // Store as a notification to HR — no separate model needed
    const notify = require("../utils/notify");
    await notify.toRole("hr", {
      title:   "Attendance Regularization Request",
      message: `${req.user.firstName} ${req.user.lastName} requested regularization for ${date}: ${reason}`,
      type:    "attendance",
    });
    respond(res, 200, "Regularization request submitted");
  } catch (err) {
    respond(res, 500, err.message);
  }
};

// GET /api/v1/attendance/dashboard-stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [today, empTotal] = await Promise.all([
      Attendance.find({ date: todayStr() }),
      Employee.countDocuments({ status: "active" }),
    ]);
    respond(res, 200, "Dashboard stats", {
      totalEmployees: empTotal,
      presentToday:   today.filter(r => r.status === "Present").length,
      onLeave:        today.filter(r => r.status === "Absent").length,
      wfhToday:       today.filter(r => r.status === "WFH").length,
    });
  } catch (err) {
    respond(res, 500, err.message);
  }
};
