require("dotenv").config();
const http         = require("http");
const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const morgan       = require("morgan");
const rateLimit    = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const { Server }   = require("socket.io");
const connectDB    = require("./config/db");
const notificationHandler = require("./socket/notificationHandler");

const mongoSanitize = require("express-mongo-sanitize");

const app    = express();
const server = http.createServer(app);

// Connect DB
connectDB();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", "https://conversations-widget.brevo.com"],
      connectSrc: ["'self'", "https://conversations-widget.brevo.com", "wss://conversations-widget.brevo.com", "https://api.brevo.com"],
      imgSrc:     ["'self'", "data:", "https://conversations-widget.brevo.com"],
      frameSrc:   ["https://conversations-widget.brevo.com"],
      styleSrc:   ["'self'", "'unsafe-inline'", "https://conversations-widget.brevo.com"],
    },
  },
}));

// CORS — allow both Vite ports, send credentials (cookies)
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
};
app.use(cors(corsOptions));

// Socket.IO
const io = new Server(server, { cors: corsOptions });
notificationHandler.init(io);

// Body parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// NoSQL injection protection
app.use(mongoSanitize());

// Logger (dev only)
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Rate limit on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many requests, please try again later" },
});

// Global rate limiter — all API routes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please slow down" },
});

// Preload all models so indexes are created on startup
require("./models/User");
require("./models/Employee");
require("./models/Attendance");
require("./models/Leave");
require("./models/Project");
require("./models/Task");
require("./models/Payroll");
require("./models/Asset");
require("./models/Notification");
require("./models/Announcement");
require("./models/WFHRequest");
require("./models/Ticket");
require("./models/OTPToken");
require("./models/Policy");
require("./models/InventoryItem");
require("./models/AuditLog");
require("./models/SystemConfig");

// Routes
app.use("/api/v1", globalLimiter);
app.use("/api/v1/auth",          authLimiter, require("./routes/auth"));
app.use("/api/v1/employees",     require("./routes/employees"));
app.use("/api/v1/attendance",    require("./routes/attendance"));
app.use("/api/v1/leaves",        require("./routes/leaves"));
app.use("/api/v1/notifications", require("./routes/notifications"));
app.use("/api/v1/announcements", require("./routes/announcements"));
app.use("/api/v1/wfh",           require("./routes/wfh"));
app.use("/api/v1/payroll",       require("./routes/payroll"));
app.use("/api/v1/assets",        require("./routes/assets"));
app.use("/api/v1/projects",      require("./routes/projects"));
app.use("/api/v1/tasks",         require("./routes/tasks"));
app.use("/api/v1/tickets",       require("./routes/tickets"));
app.use("/api/v1/policies",      require("./routes/policies"));
app.use("/api/v1/inventory",     require("./routes/inventory"));
app.use("/api/v1/audit-logs",    require("./routes/auditLogs"));
app.use("/api/v1/system-config", require("./routes/systemConfig"));
app.use("/api/v1/reports",       require("./routes/reports"));

// Health check
app.get("/health", (req, res) =>
  res.json({ success: true, message: "Server is running", env: process.env.NODE_ENV })
);

// 404
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
);

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ success: false, message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  if (process.env.NODE_ENV === "development") {
    process.stdout.write(`Server running on port ${PORT}\n`);
  }
});
