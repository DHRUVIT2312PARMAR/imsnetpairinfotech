const router = require("express").Router();
const ctrl   = require("../controllers/policyController");
const { authenticate, restrictTo } = require("../middleware/auth");

router.use(authenticate);
router.get("/",                ctrl.getAll);
router.post("/",               restrictTo("admin","superAdmin"), ctrl.create);
router.put("/:id",             restrictTo("admin","superAdmin"), ctrl.update);
router.delete("/:id",          restrictTo("admin","superAdmin"), ctrl.remove);
router.post("/:id/acknowledge", ctrl.acknowledge);

module.exports = router;
