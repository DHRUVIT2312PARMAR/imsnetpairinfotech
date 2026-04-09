const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  getAttendancePendingCount,
  getLeavePendingCount,
  getHelpdeskOpenCount,
  getAnnouncementsUnreadCount,
} = require('../controllers/notificationController');

router.use(authenticate);

// Notifications
router.get('/',              getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all',   markAllRead);
router.patch('/:id/read',   markRead);

module.exports = router;
