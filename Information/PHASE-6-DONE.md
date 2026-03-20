# Phase 6 — v1.1 Features ✅

**Date:** March 2026
**Status:** Complete
**Build:** `npx vite build` — 0 errors ✅

---

## F1 — Real-Time Notifications (Socket.IO)
- `backend/socket/notificationHandler.js` — user rooms, emit on events
- `backend/models/Notification.js` — persisted notifications
- `backend/controllers/notificationController.js` — get/markRead/markAllRead
- `backend/routes/notifications.js` — GET, PATCH routes
- `src/hooks/useSocket.jsx` — connects socket, joins user room, listens for events
- `backend/server.js` — HTTP server + Socket.IO attached

## F2 — PDF Generation (jsPDF)
- `src/services/pdfService.js` — `generatePayslipPDF()` + `generateAttendanceReportPDF()`
- `Payroll.jsx` — PDF download button on each row
- `Reports.jsx` — "Export PDF" button alongside CSV

## F3 — Dark Mode
- `src/context/ThemeContext.jsx` — isDark, toggleTheme, persists to localStorage
- `src/components/Header.jsx` — sun/moon toggle button
- `src/style.css` — `@variant dark` added for Tailwind 4
- `index.html` — `class=""` on `<html>` for dark class toggling

## F4 — Multi-Language (i18n)
- `src/i18n/index.js` — i18next config with language detector
- `src/i18n/locales/en.json` — English strings
- `src/i18n/locales/hi.json` — Hindi strings
- `src/components/Header.jsx` — EN/हि toggle button

## F5 — Email Notifications
- `backend/services/emailService.js` — sendLeaveApprovalEmail, sendLeaveRejectionEmail, sendAttendanceAlertEmail
- `backend/.env` — SMTP config keys added (fill in credentials to enable)

## F6 — CI/CD GitHub Actions
- `.github/workflows/ci.yml` — frontend build + backend syntax check on push/PR
