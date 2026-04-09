const router = require("express").Router();
const ctrl   = require("../controllers/inventoryController");
const { authenticate, restrictTo } = require("../middleware/auth");

router.use(authenticate);
router.get("/",                ctrl.getAll);
router.post("/",               restrictTo("admin","superAdmin"), ctrl.create);
router.put("/:id",             restrictTo("admin","superAdmin"), ctrl.update);
router.post("/:id/stock-in",   restrictTo("admin","superAdmin"), ctrl.stockIn);
router.delete("/:id",          restrictTo("admin","superAdmin"), ctrl.remove);

module.exports = router;
