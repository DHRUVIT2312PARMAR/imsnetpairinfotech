// GET /api/v1/employees?page=1&limit=20&sortBy=createdAt&order=desc&search=&department=&status=
const router   = require("express").Router();
const { body } = require("express-validator");
const ctrl     = require("../controllers/employeeController");
const { authenticate, restrictTo } = require("../middleware/auth");
const validate = require("../middleware/validate");

router.use(authenticate);

const employeeRules = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("department").trim().notEmpty().withMessage("Department is required"),
  body("designation").trim().notEmpty().withMessage("Designation is required"),
];

router.get("/stats", ctrl.getStats);
router.get("/",      ctrl.getAllEmployees);
router.get("/:id",   ctrl.getEmployee);
router.post("/",     restrictTo("hr","admin","superAdmin"), employeeRules, validate, ctrl.createEmployee);
router.put("/:id",   restrictTo("hr","admin","superAdmin"), ctrl.updateEmployee);
router.delete("/:id",restrictTo("hr","admin","superAdmin"), ctrl.deleteEmployee);

module.exports = router;
