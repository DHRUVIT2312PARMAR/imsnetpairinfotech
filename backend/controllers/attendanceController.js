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
