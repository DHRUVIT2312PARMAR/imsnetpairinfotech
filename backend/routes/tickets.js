const router = require("express").Router();
const ctrl   = require("../controllers/ticketController");
const { authenticate, restrictTo } = require("../middleware/auth");

router.use(authenticate);
router.get("/",     ctrl.getAll);
router.post("/",    ctrl.create);
router.put("/:id",  restrictTo("hr","admin","superAdmin"), ctrl.update);

module.exports = router;
