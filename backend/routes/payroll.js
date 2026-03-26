const router = require("express").Router();
const ctrl   = require("../controllers/payrollController");
const { authenticate, restrictTo } = require("../middleware/auth");

router.use(authenticate);
router.get("/",              ctrl.getAll);
router.post("/",             restrictTo("hr","superAdmin"), ctrl.generate);
router.put("/:id/mark-paid", restrictTo("hr","superAdmin"), ctrl.markPaid);

module.exports = router;
