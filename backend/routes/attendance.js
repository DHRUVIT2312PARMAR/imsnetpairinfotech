// GET /api/v1/attendance/records?page=1&limit=20&sortBy=date&order=desc&date=&department=&status=
const router   = require("express").Router();
const { body } = require("express-validator");
const ctrl     = require("../controllers/attendanceController");
const { authenticate, restrictTo } = require("../middleware/auth");
const validate = require("../middleware/validate");

router.use(authenticate);

const markRules = [
  body("employeeId").notEmpty().withMessage("Employee ID is required"),
  body("date").isISO8601().withMessage("Valid date is required"),
  body("status").isIn(["Present","Absent","WFH","Half Day"]).withMessage("Invalid status"),
];

// Employee-only routes (own data)
router.get("/my-today",   ctrl.getMyToday);
router.get("/my-summary", ctrl.getMySummary);
router.get("/my-history", ctrl.getMyHistory);
router.post("/clock-in",  ctrl.clockIn);
router.post("/clock-out", ctrl.clockOut);

router.post("/regularization", ctrl.regularization);

// HR/Admin routes
router.get("/dashboard-stats", restrictTo("admin","hr","superAdmin"), ctrl.getDashboardStats);
router.get("/weekly-data",     restrictTo("admin","hr","superAdmin"), ctrl.getWeeklyData);
router.get("/today",           restrictTo("admin","hr","superAdmin"), ctrl.getToday);
router.get("/records",         restrictTo("admin","hr","superAdmin"), ctrl.getRecords);
router.post("/mark",           restrictTo("hr","admin","superAdmin"), markRules, validate, ctrl.markAttendance);

module.exports = router;
