const router = require("express").Router();
const ctrl   = require("../controllers/auditLogController");
const { authenticate, restrictTo } = require("../middleware/auth");

router.use(authenticate);
router.get("/", restrictTo("admin","superAdmin"), ctrl.getAll);

module.exports = router;
