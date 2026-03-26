const router = require("express").Router();
const ctrl   = require("../controllers/projectController");
const { authenticate, restrictTo } = require("../middleware/auth");

router.use(authenticate);
router.get("/",     ctrl.getAll);
router.post("/",    restrictTo("hr","superAdmin"), ctrl.create);
router.put("/:id",  restrictTo("hr","superAdmin"), ctrl.update);
router.delete("/:id", restrictTo("hr","superAdmin"), ctrl.remove);

module.exports = router;
