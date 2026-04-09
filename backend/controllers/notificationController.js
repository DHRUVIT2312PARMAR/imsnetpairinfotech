const Notification = require('../models/Notification');

// GET /api/v1/notifications?limit=10&offset=0
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit  = Math.min(50, parseInt(req.query.limit  ?? '20', 10));
    const skip   = parseInt(req.query.offset ?? '0',  10);

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error('[getNotifications]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/v1/notifications/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });
    res.json({ success: true, count });
  } catch (err) {
    console.error('[getUnreadCount]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PATCH /api/v1/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true }
    );
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    console.error('[markRead]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PATCH /api/v1/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id },
      { isRead: true }
    );
    res.json({ success: true, message: 'All marked as read' });
  } catch (err) {
    console.error('[markAllRead]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Badge count endpoints
// GET /api/v1/attendance/pending-count
exports.getAttendancePendingCount = async (req, res) => {
  try {
    const Attendance = require('../models/Attendance');
    const { role, _id } = req.user;
    
    const query = ['superAdmin','admin','hr'].includes(role)
      ? { status: 'pending' }
      : { status: 'pending', userId: _id };
    
    const count = await Attendance.countDocuments(query);
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/v1/leaves/pending-count
exports.getLeavePendingCount = async (req, res) => {
  try {
    const Leave = require('../models/Leave');
    const { role, _id } = req.user;
    
    const query = ['superAdmin','admin','hr'].includes(role)
      ? { status: 'pending' }
      : { status: 'pending', userId: _id };
    
    const count = await Leave.countDocuments(query);
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/v1/tickets/open-count
exports.getHelpdeskOpenCount = async (req, res) => {
  try {
    const Ticket = require('../models/Ticket');
    const { role, _id } = req.user;
    
    const query = ['superAdmin','admin','hr'].includes(role)
      ? { status: 'open' }
      : { status: 'open', createdBy: _id };
    
    const count = await Ticket.countDocuments(query);
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/v1/announcements/unread-count
exports.getAnnouncementsUnreadCount = async (req, res) => {
  try {
    const Announcement = require('../models/Announcement');
    const { role, _id } = req.user;
    
    // Get all active announcements for this role
    const announcements = await Announcement.find({
      targetRoles: role,
      isActive: true,
    }).select('_id readBy');
    
    // Count unread (not in readBy array)
    const unreadCount = announcements.filter(a => !a.readBy?.includes(_id.toString())).length;
    
    res.json({ success: true, count: unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
