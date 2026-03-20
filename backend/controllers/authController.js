require("dotenv").config();
const jwt       = require("jsonwebtoken");
const bcrypt    = require("bcryptjs");
const crypto    = require("crypto");
const speakeasy = require("speakeasy");
const QRCode    = require("qrcode");
const User      = require("../models/User");
const OTPToken  = require("../models/OTPToken");
const { sendOTP } = require("../utils/mailer");

// ─── Cookie options ───────────────────────────────────────────────────────────
const isProd = process.env.NODE_ENV === "production";

const ACCESS_COOKIE = {
  httpOnly: true,
  secure:   isProd,
  sameSite: isProd ? "strict" : "lax",
  maxAge:   15 * 60 * 1000,
};

const REFRESH_COOKIE = {
  httpOnly: true,
  secure:   isProd,
  sameSite: isProd ? "strict" : "lax",
  maxAge:   7 * 24 * 60 * 60 * 1000,
  path:     "/api/v1/auth",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const signAccess = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "15m" });

const signRefresh = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: "7d" });

const signTemp = (userId) =>
  jwt.sign({ userId, step: "mfa" }, process.env.JWT_SECRET, { expiresIn: "5m" });

const respond = (res, status, message, data = null) =>
  res.status(status).json({
    success: status < 400,
    message,
    data,
    error: status >= 400 ? message : null,
  });

const safeUser = (user) => ({
  id:           user._id,
  systemEmail:  user.systemEmail,
  firstName:    user.firstName,
  lastName:     user.lastName,
  role:         user.role,
  isVerified:   user.isVerified,
  profile: {
    avatar:     user.profile?.avatar || "",
    isComplete: user.profile?.isComplete || false,
  },
});

// ─── Email generation ─────────────────────────────────────────────────────────
const cleanName = (str) =>
  str.toLowerCase().trim().replace(/\s+/g, "").replace(/[^a-z]/g, "")
     .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const ROLE_SLUG = {
  employee: "employee", hr: "hr", admin: "admin", superAdmin: "superadmin",
};

const generateSystemEmail = (firstName, lastName, role) =>
  `${cleanName(firstName)}.${cleanName(lastName)}.${ROLE_SLUG[role]}@netpair.com`;

const resolveCollision = async (baseEmail) => {
  const [local, domain] = baseEmail.split("@");
  const count = await User.countDocuments({
    systemEmail: { $regex: `^${local}(\\d+)?@${domain}$` },
  });
  return count === 0 ? baseEmail : `${local}${count + 1}@${domain}`;
};

// ─── DEV FLAG — set to false in production when Brevo OTP is fully tested ─────
const IS_DEV_AUTO_VERIFY = true;

// ─── POST /api/v1/auth/register ───────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, role, personalEmail, password } = req.body;

    const base        = generateSystemEmail(firstName, lastName, role);
    const systemEmail = await resolveCollision(base);

    const emailExists = await User.findOne({ personalEmail: personalEmail.toLowerCase().trim() });
    if (emailExists)
      return respond(res, 400, "This personal email is already registered");

    const hashedPassword = await bcrypt.hash(password, 12);
    const mfaMethod      = ["admin", "superAdmin"].includes(role) ? "totp" : "otp";

    const user = await User.create({
      firstName:     firstName.trim(),
      lastName:      lastName.trim(),
      role,
      systemEmail,
      personalEmail: personalEmail.toLowerCase().trim(),
      username:      `${firstName} ${lastName}`,
      email:         systemEmail,
      password:      hashedPassword,
      mfaMethod,
      isVerified:    IS_DEV_AUTO_VERIFY,
      isActive:      true,
    });

    // ── Dev mode — skip OTP/TOTP, user can log in immediately ────────────
    if (IS_DEV_AUTO_VERIFY) {
      return respond(res, 200, "Account created. You can now log in.", {
        systemEmail,
        mfaMethod,
        tempUserId:   user._id,
        autoVerified: true,
        qrCode:       null,
      });
    }

    // ── OTP path (employee & hr) ──────────────────────────────────────────
    if (mfaMethod === "otp") {
      const otp = String(crypto.randomInt(100000, 999999));
      await OTPToken.create({
        userId:    user._id,
        otp,
        purpose:   "email_verification",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
      await sendOTP(personalEmail, firstName, otp, "verification");

      return respond(res, 200, "Account created. Check your email for the verification code.", {
        systemEmail, mfaMethod: "otp", tempUserId: user._id, autoVerified: false,
      });
    }

    // ── TOTP path (admin & superAdmin) ────────────────────────────────────
    const secret = speakeasy.generateSecret({
      name:   `NetPair (${systemEmail})`,
      issuer: "NetPair Infotech",
      length: 32,
    });
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    await User.findByIdAndUpdate(user._id, { totpSecret: secret.base32 });

    return respond(res, 200, "Account created. Scan the QR code with your authenticator app.", {
      systemEmail, mfaMethod: "totp", tempUserId: user._id, autoVerified: false, qrCode,
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    respond(res, 500, err.message);
  }
};

// ─── POST /api/v1/auth/setup-mfa ─────────────────────────────────────────────
exports.setupMfa = async (req, res) => {
  try {
    const { tempUserId, mfaCode } = req.body;
    if (!tempUserId || !mfaCode)
      return respond(res, 400, "tempUserId and mfaCode are required");

    const user = await User.findById(tempUserId).select("+totpSecret");
    if (!user)       return respond(res, 404, "User not found");
    if (user.isVerified) return respond(res, 400, "Account already verified");

    // ── OTP verify ────────────────────────────────────────────────────────
    if (user.mfaMethod === "otp") {
      const record = await OTPToken.findOne({
        userId:    user._id,
        purpose:   "email_verification",
        used:      false,
        expiresAt: { $gt: new Date() },
      });

      if (!record)
        return respond(res, 400, "OTP expired. Please register again.");

      await OTPToken.findByIdAndUpdate(record._id, { $inc: { attempts: 1 } });

      if (record.attempts >= 5)
        return respond(res, 400, "Too many attempts. Please register again.");

      if (record.otp !== String(mfaCode))
        return respond(res, 400, "Invalid OTP");

      await OTPToken.findByIdAndUpdate(record._id, { used: true });
    }

    // ── TOTP verify ───────────────────────────────────────────────────────
    if (user.mfaMethod === "totp") {
      const valid = speakeasy.totp.verify({
        secret:   user.totpSecret,
        encoding: "base32",
        token:    String(mfaCode),
        window:   1,
      });
      if (!valid) return respond(res, 400, "Invalid authenticator code. Try again.");
    }

    await User.findByIdAndUpdate(user._id, {
      isVerified:  true,
      totpEnabled: user.mfaMethod === "totp",
    });

    respond(res, 200, "Account verified successfully. You can now log in.", {});
  } catch (err) {
    console.error("SETUP-MFA ERROR:", err.message);
    respond(res, 500, err.message);
  }
};

// ─── POST /api/v1/auth/resend-otp (registration) ─────────────────────────────
exports.resendOtp = async (req, res) => {
  try {
    const { tempUserId, tempToken } = req.body;

    let userId = tempUserId;

    // Support both registration resend (tempUserId) and login resend (tempToken)
    if (!userId && tempToken) {
      try {
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch {
        return respond(res, 401, "Session expired — please log in again");
      }
    }

    if (!userId) return respond(res, 400, "tempUserId or tempToken required");

    const user = await User.findById(userId);
    if (!user) return respond(res, 404, "User not found");
    if (user.mfaMethod !== "otp") return respond(res, 400, "OTP not applicable for this account");

    // Max 3 resends per hour
    const recentCount = await OTPToken.countDocuments({
      userId,
      createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) },
    });
    if (recentCount >= 3)
      return respond(res, 429, "Too many resend requests. Wait 1 hour before trying again.");

    // Invalidate old OTPs
    const purpose = user.isVerified ? "login_mfa" : "email_verification";
    await OTPToken.updateMany({ userId, purpose, used: false }, { used: true });

    const otp = String(crypto.randomInt(100000, 999999));
    await OTPToken.create({
      userId,
      otp,
      purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOTP(user.personalEmail, user.firstName, otp,
      user.isVerified ? "login" : "verification");

    respond(res, 200, "New verification code sent to your email.");
  } catch (err) {
    console.error("RESEND-OTP ERROR:", err.message);
    respond(res, 500, err.message);
  }
};

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { systemEmail, password } = req.body;

    if (!systemEmail || !password)
      return respond(res, 400, "Email and password are required");

    // Case-insensitive lookup — also check legacy email field
    const user = await User.findOne({
      $or: [
        { systemEmail: systemEmail.toLowerCase().trim() },
        { email:       systemEmail.toLowerCase().trim() },
      ],
    }).select("+password +totpSecret");

    // Debug logs — remove before production
    console.log("[LOGIN] Email:", systemEmail);
    console.log("[LOGIN] User found:", user ? "YES" : "NO");
    if (user) {
      console.log("[LOGIN] isVerified:", user.isVerified);
      console.log("[LOGIN] isActive:  ", user.isActive);
      console.log("[LOGIN] mfaMethod: ", user.mfaMethod);
    }

    if (!user)
      return respond(res, 401, "Invalid email or password");

    if (!user.isActive)
      return respond(res, 401, "Account is deactivated. Contact your administrator.");

    if (!user.isVerified) {
      return respond(res, 401,
        isProd
          ? "Invalid email or password"
          : "Account not verified. Run: npm run seed  or contact admin."
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log("[LOGIN] Password match:", passwordMatch);

    if (!passwordMatch)
      return respond(res, 401, "Invalid email or password");

    // Send OTP for employee/hr — don't block login if email fails
    if (user.mfaMethod === "otp") {
      try {
        await OTPToken.updateMany(
          { userId: user._id, purpose: "login_mfa", used: false },
          { used: true }
        );
        const otp = String(crypto.randomInt(100000, 999999));
        await OTPToken.create({
          userId:    user._id,
          otp,
          purpose:   "login_mfa",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        await sendOTP(user.personalEmail, user.firstName, otp, "login");
      } catch (otpErr) {
        console.error("[LOGIN] OTP send error:", otpErr.message);
        // Continue — don't block login if email fails
      }
    }

    // ── Mask personal email for display hint ──────────────────────────────
    const maskEmail = (email) => {
      if (!email || !email.includes("@")) return email;
      const [local, domain] = email.split("@");
      if (local.length <= 2) return `${local[0]}${"*".repeat(local.length - 1)}@${domain}`;
      if (local.length === 3) return `${local[0]}*${local[local.length - 1]}@${domain}`;
      return `${local[0]}${"*".repeat(local.length - 3)}${local.slice(-2)}@${domain}`;
    };
    const maskedEmail = user.mfaMethod === "otp" ? maskEmail(user.personalEmail) : null;

    const tempToken = signTemp(user._id);

    respond(res, 200,
      user.mfaMethod === "otp"
        ? "Verification code sent to your personal email"
        : "Enter the code from your authenticator app",
      { mfaRequired: true, mfaMethod: user.mfaMethod, tempToken, maskedEmail }
    );
  } catch (err) {
    console.error("[LOGIN] ERROR:", err.message);
    respond(res, 500, "Login failed. Please try again.");
  }
};

// ─── POST /api/v1/auth/verify-mfa ────────────────────────────────────────────
exports.verifyMfa = async (req, res) => {
  try {
    const { tempToken, mfaCode } = req.body;
    if (!tempToken || !mfaCode)
      return respond(res, 400, "tempToken and mfaCode are required");

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return respond(res, 401, "Session expired — please log in again");
    }
    if (decoded.step !== "mfa")
      return respond(res, 401, "Invalid session token");

    const user = await User.findById(decoded.userId).select("+totpSecret");
    if (!user || !user.isActive)
      return respond(res, 401, "User not found or deactivated");

    // ── OTP verify ────────────────────────────────────────────────────────
    if (user.mfaMethod === "otp") {
      const record = await OTPToken.findOne({
        userId:    user._id,
        purpose:   "login_mfa",
        used:      false,
        expiresAt: { $gt: new Date() },
      });
      if (!record || record.otp !== String(mfaCode))
        return respond(res, 400, "Invalid or expired code. Request a new one.");

      await OTPToken.findByIdAndUpdate(record._id, { used: true });
    }

    // ── TOTP verify ───────────────────────────────────────────────────────
    if (user.mfaMethod === "totp") {
      const valid = speakeasy.totp.verify({
        secret:   user.totpSecret,
        encoding: "base32",
        token:    String(mfaCode),
        window:   1,
      });
      if (!valid) return respond(res, 400, "Invalid authenticator code");
    }

    // Issue real tokens
    const accessToken  = signAccess(user._id);
    const refreshToken = signRefresh(user._id);

    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    user.lastLogin    = new Date();
    await user.save();

    res.cookie("token",        accessToken,  ACCESS_COOKIE);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE);

    respond(res, 200, "Login successful", { user: safeUser(user) });
  } catch (err) {
    console.error("VERIFY-MFA ERROR:", err.message);
    respond(res, 500, err.message);
  }
};

// ─── POST /api/v1/auth/refresh ────────────────────────────────────────────────
exports.refresh = async (req, res) => {
  try {
    const incomingRefresh = req.cookies?.refreshToken;
    if (!incomingRefresh) return respond(res, 401, "No refresh token");

    let decoded;
    try {
      decoded = jwt.verify(
        incomingRefresh,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
    } catch {
      return respond(res, 401, "Invalid or expired refresh token");
    }

    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || !user.refreshToken)
      return respond(res, 401, "Session expired — please login again");

    const valid = await bcrypt.compare(incomingRefresh, user.refreshToken);
    if (!valid) return respond(res, 401, "Invalid refresh token");
    if (!user.isActive) return respond(res, 401, "Account is deactivated");

    const newAccess  = signAccess(user._id);
    const newRefresh = signRefresh(user._id);

    user.refreshToken = await bcrypt.hash(newRefresh, 10);
    await user.save();

    res.cookie("token",        newAccess,  ACCESS_COOKIE);
    res.cookie("refreshToken", newRefresh, REFRESH_COOKIE);

    respond(res, 200, "Token refreshed", { user: safeUser(user) });
  } catch (err) {
    respond(res, 500, err.message);
  }
};

// ─── POST /api/v1/auth/logout ─────────────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }
  } catch { /* ignore */ }
  res.clearCookie("token",        { httpOnly: true, sameSite: isProd ? "strict" : "lax" });
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: isProd ? "strict" : "lax", path: "/api/v1/auth" });
  respond(res, 200, "Logged out successfully");
};

// ─── GET /api/v1/auth/me ──────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  respond(res, 200, "User fetched", safeUser(req.user));
};

// ─── PUT /api/v1/auth/profile ─────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, personalEmail, phone, department, designation, address } = req.body;

    if (!firstName?.trim() || !lastName?.trim())
      return respond(res, 400, "First and last name are required");

    const updates = {
      firstName:     firstName.trim(),
      lastName:      lastName.trim(),
      username:      `${firstName.trim()} ${lastName.trim()}`,
      phone:         phone?.trim() || "",
      department:    department?.trim() || "",
      designation:   designation?.trim() || "",
      address:       address?.trim() || "",
    };

    // Personal email update — only if changed and not already taken
    if (personalEmail && personalEmail.toLowerCase().trim() !== req.user.personalEmail) {
      const exists = await User.findOne({
        personalEmail: personalEmail.toLowerCase().trim(),
        _id: { $ne: req.user._id },
      });
      if (exists) return respond(res, 400, "This personal email is already in use");
      updates.personalEmail = personalEmail.toLowerCase().trim();
    }

    const updated = await User.findByIdAndUpdate(req.user._id, updates, { new: true });

    respond(res, 200, "Profile updated successfully", safeUser(updated));
  } catch (err) {
    console.error("UPDATE-PROFILE ERROR:", err.message);
    respond(res, 500, err.message);
  }
};

// ─── PUT /api/v1/auth/change-password ────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return respond(res, 400, "Current and new password are required");

    if (newPassword.length < 8)
      return respond(res, 400, "New password must be at least 8 characters");

    const user = await User.findById(req.user._id).select("+password");
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return respond(res, 400, "Current password is incorrect");

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    respond(res, 200, "Password changed successfully");
  } catch (err) {
    console.error("CHANGE-PASSWORD ERROR:", err.message);
    respond(res, 500, err.message);
  }
};
