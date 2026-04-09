// ============================================================
//  NAVBAR BACKEND  —  Express routes + controllers
//  Covers: notifications + badge count endpoints
//  Drop into: src/routes/navRoutes.js
//             src/controllers/navController.js
// ============================================================

// ─────────────────────────────────────────────────────────────
//  DB SCHEMA  (add to your migrations)
// ─────────────────────────────────────────────────────────────
/*
CREATE TABLE notifications (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message     TEXT        NOT NULL,
  icon        VARCHAR(60) DEFAULT 'ri-notification-3-line',
  link        TEXT,                        -- optional deep-link URL
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user    ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Helper: call this from other parts of the app to push a notification
-- Example: SELECT create_notification('uuid-of-user', 'Your leave was approved', 'ri-check-line', '/leave');
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID, p_message TEXT, p_icon TEXT DEFAULT 'ri-notification-3-line', p_link TEXT DEFAULT NULL
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO notifications (user_id, message, icon, link) VALUES (p_user_id, p_message, p_icon, p_link);
END;
$$;
*/

// ─────────────────────────────────────────────────────────────
//  navController.js
// ─────────────────────────────────────────────────────────────
const { Pool } = require('pg');
const pool = new Pool(); // uses env vars: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD

/**
 * GET /api/notifications?limit=10&offset=0
 * Returns notifications for the logged-in user.
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit  = Math.min(50, parseInt(req.query.limit  ?? '20', 10));
    const offset =             parseInt(req.query.offset ?? '0',  10);

    const { rows } = await pool.query(
      `SELECT id, message, icon, link, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('[getNotifications]', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
  try {
    const { rows: [{ count }] } = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ count: Number(count) });
  } catch (err) {
    console.error('[getUnreadCount]', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * PATCH /api/notifications/:id/read
 */
const markRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('[markRead]', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * PATCH /api/notifications/read-all
 */
const markAllRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ message: 'All marked as read' });
  } catch (err) {
    console.error('[markAllRead]', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── Badge count endpoints ────────────────────────────────────
/**
 * Each returns { count: N }
 * Role-aware: HR sees all pending leave, employee sees only their own.
 */

const getAttendancePendingCount = async (req, res) => {
  try {
    const { role, id } = req.user;
    const query = ['super_admin','admin','hr'].includes(role)
      ? 'SELECT COUNT(*) FROM attendance WHERE status = $1'
      : 'SELECT COUNT(*) FROM attendance WHERE status = $1 AND user_id = $2';
    const params = ['pending', ...(['super_admin','admin','hr'].includes(role) ? [] : [id])];
    const { rows: [{ count }] } = await pool.query(query, params);
    res.json({ count: Number(count) });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getLeavePendingCount = async (req, res) => {
  try {
    const { role, id } = req.user;
    const query = ['super_admin','admin','hr'].includes(role)
      ? 'SELECT COUNT(*) FROM leave_requests WHERE status = $1'
      : 'SELECT COUNT(*) FROM leave_requests WHERE status = $1 AND user_id = $2';
    const params = ['pending', ...(['super_admin','admin','hr'].includes(role) ? [] : [id])];
    const { rows: [{ count }] } = await pool.query(query, params);
    res.json({ count: Number(count) });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getHelpdeskOpenCount = async (req, res) => {
  try {
    const { role, id } = req.user;
    const query = ['super_admin','admin','hr'].includes(role)
      ? "SELECT COUNT(*) FROM helpdesk_tickets WHERE status = 'open'"
      : "SELECT COUNT(*) FROM helpdesk_tickets WHERE status = 'open' AND user_id = $1";
    const params = ['super_admin','admin','hr'].includes(role) ? [] : [id];
    const { rows: [{ count }] } = await pool.query(query, params);
    res.json({ count: Number(count) });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAnnouncementsUnreadCount = async (req, res) => {
  try {
    const { role, id } = req.user;
    const { rows: [{ count }] } = await pool.query(
      `SELECT COUNT(*) FROM announcements a
       JOIN announcement_roles ar ON ar.announcement_id = a.id
       WHERE ar.role = $1
         AND a.is_deleted = FALSE
         AND a.published_at <= NOW()
         AND (a.expires_at IS NULL OR a.expires_at > NOW())
         AND NOT EXISTS (
           SELECT 1 FROM announcement_reads rd
           WHERE rd.announcement_id = a.id AND rd.user_id = $2
         )`,
      [role, id]
    );
    res.json({ count: Number(count) });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  getAttendancePendingCount,
  getLeavePendingCount,
  getHelpdeskOpenCount,
  getAnnouncementsUnreadCount,
};

// ─────────────────────────────────────────────────────────────
//  navRoutes.js
// ─────────────────────────────────────────────────────────────
const express    = require('express');
const router     = express.Router();
const authenticate = require('../middleware/authenticate'); // your JWT middleware

const {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  getAttendancePendingCount,
  getLeavePendingCount,
  getHelpdeskOpenCount,
  getAnnouncementsUnreadCount,
} = require('../controllers/navController');

router.use(authenticate);

// Notifications
router.get('/notifications',              getNotifications);
router.get('/notifications/unread-count', getUnreadCount);
router.patch('/notifications/read-all',   markAllRead);
router.patch('/notifications/:id/read',   markRead);

// Badge counts (used by Sidebar)
router.get('/attendance/pending-count',      getAttendancePendingCount);
router.get('/leave/pending-count',           getLeavePendingCount);
router.get('/helpdesk/open-count',           getHelpdeskOpenCount);
router.get('/announcements/unread-count',    getAnnouncementsUnreadCount);

module.exports = router;

// ─────────────────────────────────────────────────────────────
//  In app.js add:
//  const navRoutes = require('./routes/navRoutes');
//  app.use('/api', navRoutes);
// ─────────────────────────────────────────────────────────────
