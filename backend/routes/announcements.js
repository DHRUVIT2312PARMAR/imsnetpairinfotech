const router = require("express").Router();
const ctrl   = require("../controllers/announcementController");
const { authenticate, restrictTo } = require("../middleware/auth");
const { ANNOUNCEMENT_CREATORS } = require("../constants/roles");

router.use(authenticate);

router.get("/allowed-targets",  ctrl.getAllowedTargets);                          // all roles
router.get("/",                 ctrl.getAll);                                     // all roles (filtered)
router.post("/",                restrictTo(...ANNOUNCEMENT_CREATORS), ctrl.create);
router.patch("/:id",            restrictTo(...ANNOUNCEMENT_CREATORS), ctrl.update);
router.delete("/:id",           restrictTo(...ANNOUNCEMENT_CREATORS), ctrl.remove);
router.post("/:id/read",        ctrl.markAsRead);                                 // all roles

// Badge count endpoint
const { getAnnouncementsUnreadCount } = require('../controllers/notificationController');
router.get("/unread-count", getAnnouncementsUnreadCount);

module.exports = router;
