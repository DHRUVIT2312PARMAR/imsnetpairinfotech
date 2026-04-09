const router = require("express").Router();
const ctrl   = require("../controllers/systemConfigController");
const { authenticate, restrictTo } = require("../middleware/auth");

router.use(authenticate);
router.get("/",  ctrl.getAll);
router.put("/",  restrictTo("superAdmin"), ctrl.update);

module.exports = router;
