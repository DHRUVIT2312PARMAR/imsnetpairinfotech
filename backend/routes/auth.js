const router   = require("express").Router();
const { body, validationResult } = require("express-validator");
const {
  register, setupMfa, resendOtp,
  login, verifyMfa,
  refresh, logout, getMe,
  updateProfile, changePassword,
} = require("../controllers/authController");
const { authenticate, restrictTo } = require("../middleware/auth");

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors:  errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const registerRules = [
  body("firstName").trim().notEmpty().withMessage("First name is required")
    .matches(/^[a-zA-Z]+$/).withMessage("First name must contain letters only")
    .isLength({ min: 2, max: 50 }).withMessage("First name must be 2-50 characters"),
  body("lastName").trim().notEmpty().withMessage("Last name is required")
    .matches(/^[a-zA-Z]+$/).withMessage("Last name must contain letters only")
    .isLength({ min: 2, max: 50 }).withMessage("Last name must be 2-50 characters"),
  body("role").notEmpty().withMessage("Role is required")
    .isIn(["employee", "hr", "admin", "superAdmin"]).withMessage("Invalid role"),
  body("personalEmail").isEmail().withMessage("Valid personal email required")
    .custom((val) => {
      if (val.endsWith("@netpair.com"))
        throw new Error("Use your personal email, not a @netpair.com address");
      return true;
    }),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/(?=.*[a-z])/).withMessage("Must include a lowercase letter")
    .matches(/(?=.*[A-Z])/).withMessage("Must include an uppercase letter")
    .matches(/(?=.*\d)/).withMessage("Must include a number")
    .matches(/(?=.*[@$!%*?&#])/).withMessage("Must include a special character (@$!%*?&#)"),
  body("confirmPassword").custom((val, { req }) => {
    if (val !== req.body.password) throw new Error("Passwords do not match");
    return true;
  }),
];

router.post("/register",   registerRules, handleValidation, register);
router.post("/setup-mfa",  setupMfa);
router.post("/resend-otp", resendOtp);
router.post("/login",      login);
router.post("/verify-mfa", verifyMfa);
router.post("/refresh",    refresh);
router.post("/logout",     logout);
router.get("/me",              authenticate, getMe);
router.put("/profile",         authenticate, updateProfile);
router.put("/change-password", authenticate, changePassword);
router.get("/users",           authenticate, restrictTo("admin","superAdmin"), async (req, res) => {
  const User = require("../models/User");
  const Employee = require("../models/Employee");
  try {
    const users = await User.find({}, "firstName lastName systemEmail role isActive createdAt").sort({ createdAt: -1 });
    const result = await Promise.all(users.map(async u => {
      const emp = await Employee.findOne({ userId: u._id }, "department designation");
      return { ...u.toObject(), department: emp?.department || "", designation: emp?.designation || "" };
    }));
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.put("/users/:id/role",  authenticate, restrictTo("admin","superAdmin"), async (req, res) => {
  const User = require("../models/User");
  try {
    const { role } = req.body;
    if (!["employee","hr","admin","superAdmin"].includes(role))
      return res.status(400).json({ success: false, message: "Invalid role" });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "Role updated", data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
