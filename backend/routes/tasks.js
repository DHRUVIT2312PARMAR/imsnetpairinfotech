const router = require("express").Router();
const ctrl   = require("../controllers/taskController");
const { authenticate, restrictTo } = require("../middleware/auth");

router.use(authenticate);
router.get("/",     ctrl.getAll);
router.post("/",    restrictTo("hr","admin","superAdmin"), ctrl.create);
router.put("/:id",  ctrl.update);
router.delete("/:id", restrictTo("admin","superAdmin"), ctrl.remove);

module.exports = router;
