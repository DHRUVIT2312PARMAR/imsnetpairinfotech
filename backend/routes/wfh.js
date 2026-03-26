const router = require("express").Router();
const ctrl   = require("../controllers/wfhController");
const { authenticate, restrictTo } = require("../middleware/auth");

router.use(authenticate);
router.get("/",           ctrl.getAll);
router.post("/",          ctrl.create);
router.put("/:id/status", restrictTo("hr","admin","superAdmin"), ctrl.updateStatus);

module.exports = router;
