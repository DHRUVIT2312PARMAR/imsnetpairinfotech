# NetPair IMS — Production Readiness Checklist
**Last Updated:** March 2026

---

## 🔴 CRITICAL — Must fix before going live

### 1. Rotate ALL secrets in backend/.env

Your current `.env` has real credentials committed to git history.
**Every key below must be replaced with new values before deploying.**

```env
# Generate new JWT secrets (run in terminal):
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

JWT_SECRET=<generate-new-64-byte-hex>
JWT_REFRESH_SECRET=<generate-new-64-byte-hex>

# MongoDB — create a new Atlas user with a strong password
MONGODB_URI=mongodb+srv://<new-user>:<new-password>@...

# Brevo — regenerate API key at app.brevo.com → API Keys
BREVO_API_KEY=<new-key>

# Set to production
NODE_ENV=production

# Your actual deployed frontend URL
FRONTEND_URL=https://yourdomain.com
```

> ⚠️ The current Brevo API key and MongoDB credentials are exposed in git history.
> Regenerate them immediately at their respective dashboards.

---

### 2. Set NODE_ENV=production

```env
# backend/.env
NODE_ENV=production
```

This disables Morgan request logging and enables production error handling.

---

### 3. Update frontend .env for production

```env
# netpair/.env (or create .env.production)
VITE_API_BASE_URL=https://your-backend-domain.com/api/v1
VITE_APP_NAME=IMS System - Netpair Infotech Website
VITE_COMPANY_NAME=NetPair InfoTech LLP
```

---

### 4. Fix hardcoded localhost image path in Sidebar

```jsx
// netpair/src/components/Sidebar/Sidebar.jsx — line ~55
// WRONG — breaks in production build:
src="src/assets/imgs/image-removebg-preview.png"

// CORRECT — use import:
import logo from "../../assets/imgs/image-removebg-preview.png";
// then: src={logo}
```

Same issue exists in Header.jsx for the profile picture:
```jsx
// netpair/src/components/Header.jsx
// WRONG:
src="src/assets/imgs/profile_pic.jpg"
// CORRECT:
import profilePic from "../assets/imgs/profile_pic.jpg";
// then: src={profilePic}
```

---

### 5. Add HTTPS / SSL

Never run production on plain HTTP. Options:
- **Render / Railway / Fly.io** — SSL is automatic
- **VPS (Ubuntu)** — use Nginx + Certbot (Let's Encrypt)
- **Vercel** (frontend) + **Render** (backend) — recommended free tier

---

## 🟡 IMPORTANT — Should fix before going live

### 6. Add rate limiting to all routes (not just auth)

Currently only `/api/v1/auth` has rate limiting. Add global limiter:

```js
// backend/server.js — add after existing authLimiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: "Too many requests" },
});
app.use("/api/v1", globalLimiter);
```

---

### 7. Add helmet CSP for production domain

```js
// backend/server.js — update connectSrc to include your production domain
connectSrc: ["'self'", "https://your-backend-domain.com", ...]
```

---

### 8. Add cookie security flags for production

```js
// backend/controllers/authController.js — wherever you set the cookie
res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",   // HTTPS only in prod
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000,
});
```

---

### 9. Add MongoDB connection error handling

```js
// backend/config/db.js — add reconnect logic
mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err);
});
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected — retrying...");
});
```

---

### 10. Remove console.log statements from production

Search and remove or guard all `console.log` calls:
```js
// Replace with:
if (process.env.NODE_ENV === "development") console.log(...);
```

---

### 11. Build the frontend before deploying

```bash
cd netpair
npm run build
# Output goes to netpair/dist/
# Serve dist/ via Nginx or a static host (Vercel, Netlify)
```

---

### 12. Serve frontend build from Express (optional — single server deploy)

```js
// backend/server.js — add after routes
const path = require("path");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist", "index.html"));
  });
}
```

---

## 🟢 NICE TO HAVE — Polish before launch

### 13. Add a proper 404 / error page

`NotFound.jsx` exists — make sure it has a "Go to Dashboard" button.

### 14. Add loading states to all API calls

Most pages already have skeletons. Verify pages that use mock data
show a proper empty state when backend returns no data.

### 15. Add input sanitization on backend

`express-mongo-sanitize` is already installed. Make sure it's applied:
```js
// backend/server.js
const mongoSanitize = require("express-mongo-sanitize");
app.use(mongoSanitize());
```

### 16. Implement missing backend routes

These pages currently use mock/hardcoded data — no real API:
- `/api/v1/projects`
- `/api/v1/tasks`
- `/api/v1/payroll`
- `/api/v1/assets`
- `/api/v1/announcements`
- `/api/v1/wfh`
- `/api/v1/tickets` (Helpdesk)
- `/api/v1/audit-logs`

### 17. Add pagination to all list pages

`paginate.js` utility exists — use it on every GET list endpoint.

### 18. Add proper error boundaries in React

```jsx
// Wrap App in an ErrorBoundary to catch runtime crashes gracefully
```

---

## DEPLOYMENT RECOMMENDATION

### Cheapest / Easiest Stack (Free Tier)

```
Frontend  →  Vercel        (free, auto-deploy from GitHub)
Backend   →  Render        (free tier, auto-deploy from GitHub)
Database  →  MongoDB Atlas (already set up ✅)
Email     →  Brevo         (already set up ✅)
```

### Steps
1. Push code to GitHub (already done ✅)
2. Connect Render to your GitHub repo → set root to `netpair/backend`
3. Set all env vars in Render dashboard (never commit .env)
4. Connect Vercel to your GitHub repo → set root to `netpair`
5. Set `VITE_API_BASE_URL` in Vercel env vars to your Render URL
6. Done

---

## PRIORITY ORDER

```
1. 🔴 Rotate secrets (JWT, MongoDB, Brevo)         ← Do this TODAY
2. 🔴 Fix hardcoded image paths (Sidebar, Header)  ← Breaks prod build
3. 🔴 Set NODE_ENV=production + update .env        ← Required
4. 🟡 Cookie secure flags                          ← Security
5. 🟡 Rate limiting on all routes                  ← Security
6. 🟡 Build frontend + deploy                      ← Go live
7. 🟢 Implement missing 8 backend routes           ← Full functionality
8. 🟢 Add mongo-sanitize middleware                ← Security polish
```
