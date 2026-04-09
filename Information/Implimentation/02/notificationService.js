// src/services/notificationService.js
// ============================================================
//  LIVE NOTIFICATIONS  —  WebSocket server + push helper
//  Uses: ws  (npm install ws)
//  Add to your Express app setup (see bottom of this file)
// ============================================================

const WebSocket = require('ws');
const { Pool }  = require('pg');

const pool = new Pool(); // uses PGHOST, PGPORT etc. from env

// ─── In-memory map: userId → Set of WebSocket clients ────────
const clients = new Map(); // Map<userId, Set<WebSocket>>

/**
 * Register a client connection for a user
 */
const registerClient = (userId, ws) => {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(ws);
};

/**
 * Unregister a client on disconnect
 */
const unregisterClient = (userId, ws) => {
  clients.get(userId)?.delete(ws);
  if (clients.get(userId)?.size === 0) clients.delete(userId);
};

/**
 * Push a notification object to all open sockets for a user
 */
const pushToUser = (userId, payload) => {
  const sockets = clients.get(userId);
  if (!sockets) return;
  const msg = JSON.stringify(payload);
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.send(msg); } catch { /* ignore broken pipe */ }
    }
  }
};

// ─────────────────────────────────────────────────────────────
//  createNotification(userId, message, icon?, link?)
//  Call this from ANYWHERE in your backend to push a real-time
//  notification + persist it to DB.
// ─────────────────────────────────────────────────────────────
const createNotification = async (userId, message, icon = 'ri-notification-3-line', link = null) => {
  const { rows: [notification] } = await pool.query(
    `INSERT INTO notifications (user_id, message, icon, link)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, message, icon, link]
  );

  // Push via WebSocket if user is online
  pushToUser(userId, {
    type:         'NEW_NOTIFICATION',
    notification: {
      id:         notification.id,
      message:    notification.message,
      icon:       notification.icon,
      link:       notification.link,
      is_read:    false,
      created_at: notification.created_at,
    },
  });

  return notification;
};

/**
 * Broadcast to all users with a specific role.
 * Useful for announcements, system messages, etc.
 */
const createNotificationForRole = async (role, message, icon, link) => {
  const { rows: users } = await pool.query(
    'SELECT id FROM users WHERE role = $1 AND is_active = TRUE',
    [role]
  );
  await Promise.allSettled(
    users.map((u) => createNotification(u.id, message, icon, link))
  );
};

/**
 * Broadcast to ALL active users.
 */
const broadcastNotification = async (message, icon, link) => {
  const { rows: users } = await pool.query(
    'SELECT id FROM users WHERE is_active = TRUE'
  );
  await Promise.allSettled(
    users.map((u) => createNotification(u.id, message, icon, link))
  );
};

// ─────────────────────────────────────────────────────────────
//  initWebSocketServer(server)
//  Call this in your app.js after creating the HTTP server.
//
//  Usage:
//    const server = app.listen(PORT);
//    const { initWebSocketServer } = require('./services/notificationService');
//    initWebSocketServer(server);
// ─────────────────────────────────────────────────────────────
const initWebSocketServer = (httpServer, authenticateWS) => {
  const wss = new WebSocket.Server({ server: httpServer, path: '/ws/notifications' });

  wss.on('connection', async (ws, req) => {
    // ── Authenticate the WS connection ──
    // Parse JWT from cookie or query param: ?token=xxx
    let userId = null;
    try {
      const url    = new URL(req.url, `http://${req.headers.host}`);
      const token  = url.searchParams.get('token')
        ?? req.headers.cookie?.match(/np_token=([^;]+)/)?.[1];

      if (!token) { ws.close(4001, 'Unauthorized'); return; }

      // Reuse your existing JWT verify function
      const decoded = await authenticateWS(token); // returns { id, role, ... }
      userId = decoded.id;
    } catch {
      ws.close(4001, 'Invalid token');
      return;
    }

    registerClient(userId, ws);

    // Send any missed notifications on reconnect
    try {
      const { rows } = await pool.query(
        `SELECT id, message, icon, link, is_read, created_at
         FROM notifications WHERE user_id = $1 AND is_read = FALSE
         ORDER BY created_at DESC LIMIT 10`,
        [userId]
      );
      if (rows.length > 0) {
        ws.send(JSON.stringify({ type: 'MISSED_NOTIFICATIONS', notifications: rows }));
      }
    } catch { /* silent */ }

    // Ping/pong keepalive
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('close', () => unregisterClient(userId, ws));
    ws.on('error', () => { ws.terminate(); unregisterClient(userId, ws); });
  });

  // Heartbeat: drop dead connections every 30s
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) { ws.terminate(); return; }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30_000);

  wss.on('close', () => clearInterval(heartbeat));

  console.log('✅ WebSocket notification server running on /ws/notifications');
  return wss;
};

module.exports = {
  initWebSocketServer,
  createNotification,
  createNotificationForRole,
  broadcastNotification,
};

// ─────────────────────────────────────────────────────────────
//  USAGE EXAMPLES throughout your backend:
//
//  const { createNotification, createNotificationForRole, broadcastNotification }
//    = require('../services/notificationService');
//
//  // Leave approved → notify the employee
//  await createNotification(
//    leave.user_id,
//    'Your leave request has been approved ✅',
//    'ri-calendar-check-line',
//    '/leave'
//  );
//
//  // New announcement → notify all HR
//  await createNotificationForRole(
//    'hr',
//    'New HR policy document uploaded',
//    'ri-file-add-line',
//    '/policies'
//  );
//
//  // System maintenance → notify everyone
//  await broadcastNotification(
//    'System maintenance on Sunday 2–4 AM',
//    'ri-tools-line',
//    null
//  );
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
//  In app.js:
//
//  const http = require('http');
//  const app  = require('./app');
//  const { initWebSocketServer } = require('./services/notificationService');
//  const { verifyToken } = require('./middleware/authenticate'); // your JWT verify fn
//
//  const server = http.createServer(app);
//  initWebSocketServer(server, verifyToken);
//  server.listen(process.env.PORT || 5000);
// ─────────────────────────────────────────────────────────────
