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

router.get("/dashboard-stats", ctrl.getDashboardStats);
router.get("/weekly-data",     ctrl.getWeeklyData);
router.get("/today",           ctrl.getToday);
router.get("/records",         ctrl.getRecords);
router.post("/mark",           restrictTo("hr","admin","superAdmin"), markRules, validate, ctrl.markAttendance);

module.exports = router;
