const router = require("express").Router();
const ctrl   = require("../controllers/reportsController");
const { authenticate, restrictTo } = require("../middleware/auth");

router.use(authenticate);
router.use(restrictTo("admin","hr","superAdmin"));
router.get("/summary",             ctrl.getSummary);
router.get("/attendance-trend",    ctrl.getAttendanceTrend);
router.get("/leave-by-type",       ctrl.getLeaveByType);
router.get("/attendance-records",  ctrl.getAttendanceRecords);

module.exports = router;
