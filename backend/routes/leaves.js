// GET /api/v1/leaves?page=1&limit=20&sortBy=createdAt&order=desc&status=&type=&search=
const router   = require("express").Router();
const { body } = require("express-validator");
const ctrl     = require("../controllers/leaveController");
const { authenticate, restrictTo } = require("../middleware/auth");
const validate = require("../middleware/validate");

router.use(authenticate);

const leaveRules = [
  body("employeeName").trim().notEmpty().withMessage("Employee name is required"),
  body("type").isIn(["Annual","Sick","Casual","Emergency"]).withMessage("Invalid leave type"),
  body("fromDate").isISO8601().withMessage("Valid from date is required"),
  body("toDate").isISO8601().withMessage("Valid to date is required"),
];

router.get("/balance/:employeeId", ctrl.getBalance);
router.get("/",                    ctrl.getLeaves);
router.post("/",                   leaveRules, validate, ctrl.applyLeave);
router.put("/:id/approve",         restrictTo("hr","admin","superAdmin"), ctrl.approveLeave);
router.put("/:id/reject",          restrictTo("hr","admin","superAdmin"), ctrl.rejectLeave);

module.exports = router;
