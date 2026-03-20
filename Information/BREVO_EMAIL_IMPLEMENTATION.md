# Brevo Email Implementation Guide
## NetPair IMS — OTP Email via Brevo API

**Service:** Brevo (formerly Sendinblue)  
**Method:** HTTP API (not SMTP — required for Vercel serverless)  
**Free Tier:** 300 emails/day, forever, no credit card  
**Use Case:** OTP verification for Employee & HR roles  
**Last Updated:** March 2026  

---

## TABLE OF CONTENTS

1. [Brevo Account Setup](#1-brevo-account-setup)
2. [Get API Key](#2-get-api-key)
3. [Environment Variables](#3-environment-variables)
4. [Install Dependencies](#4-install-dependencies)
5. [Mailer Utility](#5-mailer-utility)
6. [OTP Token Model](#6-otp-token-model)
7. [Register Controller Integration](#7-register-controller-integration)
8. [Setup-MFA Controller](#8-setup-mfa-controller)
9. [Login MFA Controller](#9-login-mfa-controller)
10. [Auth Routes](#10-auth-routes)
11. [Test Before Deploying](#11-test-before-deploying)
12. [Vercel Deployment](#12-vercel-deployment)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. BREVO ACCOUNT SETUP

### Step 1 — Create free account

Go to this URL and sign up:

```
https://app.brevo.com/account/register
```

- Enter your name, email, password
- No credit card required — ever
- Verify your email address (Brevo sends a confirmation link)

### Step 2 — Confirm your sender email

After login, Brevo asks you to verify a sender email address. Use:

```
noreply@netpairinfotech.com
```

Or if you don't have a domain yet, use your personal Gmail temporarily:

```
yourname@gmail.com
```

Brevo sends a verification link to that address — click it.

---

## 2. GET API KEY

### Step 1 — Navigate to API Keys

In Brevo dashboard:

```
Top-right avatar → SMTP & API → API Keys tab
```

### Step 2 — Generate key

- Click **"Generate a new API key"**
- Name it: `NetPair IMS`
- Click **Generate**
- Copy the key immediately — it looks like:

```
xkeysib-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4-AbCdEfGh
```

> **Important:** Store this key somewhere safe. Brevo only shows it once.

---

## 3. ENVIRONMENT VARIABLES

### Local development — `backend/.env`

```env
# Brevo API (Email OTP)
BREVO_API_KEY=xkeysib-your-actual-api-key-here
EMAIL_FROM=noreply@netpairinfotech.com
EMAIL_FROM_NAME=NetPair IMS

# JWT (existing)
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
TEMP_TOKEN_EXPIRES_IN=5m

# MongoDB (existing)
MONGODB_URI=mongodb+srv://...
```

### Vercel deployment — add these in Vercel dashboard

```
Vercel Dashboard → your project → Settings → Environment Variables
```

Add each one separately:

| Key | Value |
|-----|-------|
| `BREVO_API_KEY` | `xkeysib-your-key-here` |
| `EMAIL_FROM` | `noreply@netpairinfotech.com` |
| `EMAIL_FROM_NAME` | `NetPair IMS` |

> **Note:** On Vercel, do NOT add SMTP variables (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS). Use only the API key.

---

## 4. INSTALL DEPENDENCIES

Run in your `backend` folder:

```bash
npm install @getbrevo/brevo
```

Also install these if not already present:

```bash
npm install crypto bcryptjs
```

Verify installation:

```bash
npm list @getbrevo/brevo
# Should show: @getbrevo/brevo@2.x.x
```

---

## 5. MAILER UTILITY

Create file: `backend/utils/mailer.js`

```javascript
const Brevo = require('@getbrevo/brevo');

// Initialize Brevo API client
const apiInstance = new Brevo.TransactionalEmailsApi();

apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

/**
 * Send OTP verification email
 * @param {string} toEmail   - recipient email (user's personal email)
 * @param {string} toName    - recipient name (user's first name)
 * @param {string} otp       - 6-digit OTP code
 * @param {string} purpose   - 'verification' | 'login'
 */
async function sendOTP(toEmail, toName, otp, purpose = 'verification') {
  const subjects = {
    verification: 'Verify your NetPair account',
    login:        'Your NetPair login code',
    reset:        'Reset your NetPair password',
  };

  const email = new Brevo.SendSmtpEmail();

  email.sender = {
    name:  process.env.EMAIL_FROM_NAME || 'NetPair IMS',
    email: process.env.EMAIL_FROM,
  };

  email.to = [{ email: toEmail, name: toName }];

  email.subject = subjects[purpose] || subjects.verification;

  email.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
    </head>
    <body style="margin:0;padding:0;background:#f9fafb">
      <div style="max-width:460px;margin:40px auto;
                  background:#ffffff;border-radius:12px;
                  border:1px solid #e5e7eb;overflow:hidden">

        <!-- Header -->
        <div style="background:#1a3fb5;padding:24px 32px">
          <h1 style="color:#ffffff;margin:0;font-size:20px;
                     font-family:Arial,sans-serif;font-weight:600">
            NetPair Infotech
          </h1>
          <p style="color:#93c5fd;margin:4px 0 0;font-size:13px;
                    font-family:Arial,sans-serif">
            Integrated Management System
          </p>
        </div>

        <!-- Body -->
        <div style="padding:32px">
          <p style="color:#374151;font-family:Arial,sans-serif;
                    font-size:15px;margin:0 0 8px">
            Hello ${toName},
          </p>
          <p style="color:#6b7280;font-family:Arial,sans-serif;
                    font-size:14px;margin:0 0 24px;line-height:1.6">
            ${purpose === 'login'
              ? 'Use the code below to complete your login.'
              : 'Use the code below to verify your NetPair account.'
            }
          </p>

          <!-- OTP Box -->
          <div style="background:#eff6ff;border:1px solid #bfdbfe;
                      border-radius:8px;padding:24px;text-align:center;
                      margin-bottom:24px">
            <div style="font-size:48px;font-weight:700;
                        letter-spacing:14px;color:#1a3fb5;
                        font-family:'Courier New',monospace">
              ${otp}
            </div>
          </div>

          <!-- Expiry note -->
          <p style="color:#9ca3af;font-family:Arial,sans-serif;
                    font-size:13px;margin:0 0 8px;text-align:center">
            This code expires in <strong>10 minutes</strong>.
          </p>
          <p style="color:#9ca3af;font-family:Arial,sans-serif;
                    font-size:13px;margin:0;text-align:center">
            Never share this code with anyone.
          </p>

          <!-- Divider -->
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:28px 0">

          <!-- Security note -->
          <p style="color:#d1d5db;font-family:Arial,sans-serif;
                    font-size:12px;margin:0;text-align:center">
            If you didn't request this code, ignore this email.
            Your account is safe.
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#f9fafb;padding:16px 32px;
                    border-top:1px solid #f3f4f6;text-align:center">
          <p style="color:#d1d5db;font-family:Arial,sans-serif;
                    font-size:12px;margin:0">
            Netpair Infotech · netpairinfotech.com
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  try {
    await apiInstance.sendTransacEmail(email);
    console.log(`OTP email sent to ${toEmail} (purpose: ${purpose})`);
    return { success: true };
  } catch (err) {
    console.error('Brevo email error:', err.message || err);
    throw new Error('Failed to send verification email');
  }
}

module.exports = { sendOTP };
```

---

## 6. OTP TOKEN MODEL

Create file: `backend/models/OTPToken.js`

```javascript
const mongoose = require('mongoose');

const OTPTokenSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  otp: {
    type:     String,
    required: true,
    // Store plain OTP — hash with bcrypt in production
  },
  purpose: {
    type:     String,
    enum:     ['email_verification', 'login_mfa', 'password_reset'],
    required: true,
  },
  expiresAt: {
    type:     Date,
    required: true,
  },
  used: {
    type:    Boolean,
    default: false,
  },
  attempts: {
    type:    Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Auto-delete expired tokens from MongoDB
OTPTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTPToken', OTPTokenSchema);
```

---

## 7. REGISTER CONTROLLER INTEGRATION

In `backend/controllers/authController.js`, update the `register` function:

```javascript
const User       = require('../models/User');
const OTPToken   = require('../models/OTPToken');
const { sendOTP } = require('../utils/mailer');
const bcrypt     = require('bcryptjs');
const crypto     = require('crypto');

// Helper — generate NetPair system email
function generateSystemEmail(firstName, lastName, role) {
  const clean = s =>
    s.toLowerCase()
     .trim()
     .replace(/\s+/g, '')
     .replace(/[^a-z]/g, '');

  const roleSlug = {
    employee:   'employee',
    hr:         'hr',
    admin:      'admin',
    superAdmin: 'superadmin',
  }[role];

  return `${clean(firstName)}.${clean(lastName)}.${roleSlug}@netpair.com`;
}

// Helper — check and resolve duplicate system emails
async function resolveEmail(baseEmail) {
  const existing = await User.find({
    systemEmail: { $regex: `^${baseEmail.replace('@', '(\\d+)?@')}` }
  });
  if (existing.length === 0) return baseEmail;
  const [local, domain] = baseEmail.split('@');
  return `${local}${existing.length + 1}@${domain}`;
}

// POST /api/v1/auth/register
exports.register = async (req, res) => {
  console.log('REGISTER BODY:', req.body);
  try {
    const {
      firstName,
      lastName,
      role,
      personalEmail,
      password,
    } = req.body;

    // Generate & resolve system email
    const base        = generateSystemEmail(firstName, lastName, role);
    const systemEmail = await resolveEmail(base);

    // Check if personal email already used
    const emailExists = await User.findOne({ personalEmail });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'This personal email is already registered',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (isVerified: false until MFA completed)
    const user = await User.create({
      firstName,
      lastName,
      role,
      systemEmail,
      personalEmail,
      password:  hashedPassword,
      mfaMethod: ['admin', 'superAdmin'].includes(role) ? 'totp' : 'otp',
      isVerified: false,
    });

    // OTP path — employee & hr
    if (['employee', 'hr'].includes(role)) {
      const otp = String(crypto.randomInt(100000, 999999));

      await OTPToken.create({
        userId:    user._id,
        otp,
        purpose:   'email_verification',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });

      await sendOTP(personalEmail, firstName, otp, 'verification');

      return res.status(200).json({
        success: true,
        message: 'Account created. Check your email for the verification code.',
        data: {
          systemEmail,
          mfaMethod:  'otp',
          tempUserId: user._id,
        },
      });
    }

    // TOTP path — admin & superAdmin
    if (['admin', 'superAdmin'].includes(role)) {
      const speakeasy = require('speakeasy');
      const QRCode    = require('qrcode');

      const secret = speakeasy.generateSecret({
        name:   `NetPair (${systemEmail})`,
        issuer: 'NetPair Infotech',
        length: 32,
      });

      const qrCode = await QRCode.toDataURL(secret.otpauth_url);

      await User.findByIdAndUpdate(user._id, {
        totpSecret: secret.base32,
      });

      return res.status(200).json({
        success: true,
        message: 'Account created. Scan the QR code with your authenticator app.',
        data: {
          systemEmail,
          mfaMethod:  'totp',
          tempUserId: user._id,
          qrCode,
        },
      });
    }

  } catch (err) {
    console.error('REGISTER ERROR:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Registration failed',
    });
  }
};
```

---

## 8. SETUP-MFA CONTROLLER

Add to `backend/controllers/authController.js`:

```javascript
// POST /api/v1/auth/setup-mfa
// Called from the popup after registration
exports.setupMFA = async (req, res) => {
  try {
    const { tempUserId, mfaCode } = req.body;

    const user = await User.findById(tempUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account already verified' });
    }

    // OTP verification (employee & hr)
    if (user.mfaMethod === 'otp') {
      const record = await OTPToken.findOne({
        userId:    user._id,
        purpose:   'email_verification',
        used:      false,
        expiresAt: { $gt: new Date() },
      });

      if (!record) {
        return res.status(400).json({
          success: false,
          message: 'OTP expired. Please register again.',
        });
      }

      // Increment attempt counter
      await OTPToken.findByIdAndUpdate(record._id, { $inc: { attempts: 1 } });

      if (record.attempts >= 5) {
        return res.status(400).json({
          success: false,
          message: 'Too many attempts. Please register again.',
        });
      }

      if (record.otp !== mfaCode) {
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }

      // Mark OTP as used
      await OTPToken.findByIdAndUpdate(record._id, { used: true });
    }

    // TOTP verification (admin & superAdmin)
    if (user.mfaMethod === 'totp') {
      const speakeasy = require('speakeasy');
      const valid = speakeasy.totp.verify({
        secret:   user.totpSecret,
        encoding: 'base32',
        token:    mfaCode,
        window:   1,
      });

      if (!valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid authenticator code. Try again.',
        });
      }
    }

    // Mark account as verified
    await User.findByIdAndUpdate(user._id, {
      isVerified:  true,
      totpEnabled: user.mfaMethod === 'totp',
    });

    return res.status(200).json({
      success: true,
      message: 'Account verified successfully. You can now log in.',
    });

  } catch (err) {
    console.error('SETUP-MFA ERROR:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Verification failed',
    });
  }
};


// POST /api/v1/auth/resend-otp
// Resend OTP during registration verification
exports.resendOTP = async (req, res) => {
  try {
    const { tempUserId } = req.body;

    const user = await User.findById(tempUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Already verified' });
    }

    // Check resend limit — max 3 resends
    const recentOTPs = await OTPToken.countDocuments({
      userId:    user._id,
      purpose:   'email_verification',
      createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) }, // last 1 hour
    });

    if (recentOTPs >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many resend requests. Wait 1 hour before trying again.',
      });
    }

    // Invalidate previous OTPs
    await OTPToken.updateMany(
      { userId: user._id, purpose: 'email_verification', used: false },
      { used: true }
    );

    // Generate and send new OTP
    const otp = String(crypto.randomInt(100000, 999999));

    await OTPToken.create({
      userId:    user._id,
      otp,
      purpose:   'email_verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOTP(user.personalEmail, user.firstName, otp, 'verification');

    return res.status(200).json({
      success: true,
      message: 'New verification code sent to your email.',
    });

  } catch (err) {
    console.error('RESEND-OTP ERROR:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
```

---

## 9. LOGIN MFA CONTROLLER

Update your login function in `backend/controllers/authController.js`:

```javascript
const jwt = require('jsonwebtoken');

// POST /api/v1/auth/login — Step 1: password check
exports.login = async (req, res) => {
  try {
    const { systemEmail, password } = req.body;

    // Find user by system email
    const user = await User.findOne({ systemEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Contact admin.',
      });
    }

    // Check account is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Account not verified. Complete MFA setup first.',
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // For OTP roles — send login OTP
    if (user.mfaMethod === 'otp') {
      const otp = String(crypto.randomInt(100000, 999999));

      // Invalidate old login OTPs
      await OTPToken.updateMany(
        { userId: user._id, purpose: 'login_mfa', used: false },
        { used: true }
      );

      await OTPToken.create({
        userId:    user._id,
        otp,
        purpose:   'login_mfa',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      await sendOTP(user.personalEmail, user.firstName, otp, 'login');
    }

    // Generate short-lived temp token for MFA step
    const tempToken = jwt.sign(
      { userId: user._id, step: 'mfa' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    return res.status(200).json({
      success:     true,
      mfaRequired: true,
      mfaMethod:   user.mfaMethod,
      tempToken,
      message: user.mfaMethod === 'otp'
        ? `Verification code sent to your registered email`
        : 'Enter the code from your authenticator app',
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};


// POST /api/v1/auth/verify-mfa — Step 2: MFA check, return JWT
exports.verifyMFA = async (req, res) => {
  try {
    const { tempToken, mfaCode } = req.body;

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }

    if (decoded.step !== 'mfa') {
      return res.status(401).json({ success: false, message: 'Invalid session' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify OTP (employee & hr)
    if (user.mfaMethod === 'otp') {
      const record = await OTPToken.findOne({
        userId:    user._id,
        purpose:   'login_mfa',
        used:      false,
        expiresAt: { $gt: new Date() },
      });

      if (!record || record.otp !== mfaCode) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired code. Request a new one.',
        });
      }

      await OTPToken.findByIdAndUpdate(record._id, { used: true });
    }

    // Verify TOTP (admin & superAdmin)
    if (user.mfaMethod === 'totp') {
      const speakeasy = require('speakeasy');
      const valid = speakeasy.totp.verify({
        secret:   user.totpSecret,
        encoding: 'base32',
        token:    mfaCode,
        window:   1,
      });
      if (!valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid authenticator code',
        });
      }
    }

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    // Generate access token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          _id:         user._id,
          systemEmail: user.systemEmail,
          firstName:   user.firstName,
          lastName:    user.lastName,
          role:        user.role,
          profile: {
            avatar:     user.profile?.avatar || null,
            isComplete: user.profile?.isComplete || false,
          },
        },
      },
    });

  } catch (err) {
    console.error('VERIFY-MFA ERROR:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
```

---

## 10. AUTH ROUTES

Update `backend/routes/auth.js`:

```javascript
const express = require('express');
const router  = express.Router();
const {
  register,
  setupMFA,
  resendOTP,
  login,
  verifyMFA,
} = require('../controllers/authController');

const { body, validationResult } = require('express-validator');

// Validation middleware
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors:  errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Register validation rules
const registerRules = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .matches(/^[a-zA-Z]+$/).withMessage('First name must contain letters only')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),

  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .matches(/^[a-zA-Z]+$/).withMessage('Last name must contain letters only')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),

  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['employee', 'hr', 'admin', 'superAdmin']).withMessage('Invalid role'),

  body('personalEmail')
    .isEmail().withMessage('Valid personal email required')
    .custom(val => {
      if (val.endsWith('@netpair.com')) {
        throw new Error('Use your personal email, not a @netpair.com address');
      }
      return true;
    }),

  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/(?=.*[a-z])/).withMessage('Must include a lowercase letter')
    .matches(/(?=.*[A-Z])/).withMessage('Must include an uppercase letter')
    .matches(/(?=.*\d)/).withMessage('Must include a number')
    .matches(/(?=.*[@$!%*?&#])/).withMessage('Must include a special character'),

  body('confirmPassword')
    .custom((val, { req }) => {
      if (val !== req.body.password) throw new Error('Passwords do not match');
      return true;
    }),
];

// Routes
router.post('/register',    registerRules, handleValidation, register);
router.post('/setup-mfa',   setupMFA);
router.post('/resend-otp',  resendOTP);
router.post('/login',       login);
router.post('/verify-mfa',  verifyMFA);

module.exports = router;
```

---

## 11. TEST BEFORE DEPLOYING

### Test 1 — Brevo API connection

Run from the `backend` folder:

```bash
node -e "
require('dotenv').config();
const { sendOTP } = require('./utils/mailer');
sendOTP('your@gmail.com', 'Test User', '847291', 'verification')
  .then(() => console.log('SUCCESS — check your inbox'))
  .catch(e => console.error('FAILED:', e.message));
"
```

**Expected output:**

```
OTP email sent to your@gmail.com (purpose: verification)
SUCCESS — check your inbox
```

Check your inbox (and spam folder). You should receive the styled OTP email.

### Test 2 — Full registration flow via curl

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":      "Rahul",
    "lastName":       "Shah",
    "role":           "employee",
    "personalEmail":  "rahul@gmail.com",
    "password":       "Test@1234",
    "confirmPassword":"Test@1234"
  }'
```

**Expected response:**

```json
{
  "success": true,
  "message": "Account created. Check your email for the verification code.",
  "data": {
    "systemEmail": "rahul.shah.employee@netpair.com",
    "mfaMethod": "otp",
    "tempUserId": "64abc..."
  }
}
```

### Test 3 — Verify OTP

```bash
curl -X POST http://localhost:3000/api/v1/auth/setup-mfa \
  -H "Content-Type: application/json" \
  -d '{
    "tempUserId": "paste-id-from-above",
    "mfaCode":    "paste-otp-from-email"
  }'
```

**Expected response:**

```json
{
  "success": true,
  "message": "Account verified successfully. You can now log in."
}
```

---

## 12. VERCEL DEPLOYMENT

### Step 1 — Add environment variables

In Vercel dashboard → your project → **Settings** → **Environment Variables**:

```
BREVO_API_KEY     = xkeysib-your-key
EMAIL_FROM        = noreply@netpairinfotech.com
EMAIL_FROM_NAME   = NetPair IMS
JWT_SECRET        = your-jwt-secret
JWT_REFRESH_SECRET= your-refresh-secret
MONGODB_URI       = mongodb+srv://...
```

### Step 2 — Confirm no SMTP variables

Do NOT add these on Vercel — they cause timeout errors:

```
# DO NOT ADD ON VERCEL:
EMAIL_HOST
EMAIL_PORT
EMAIL_USER
EMAIL_PASS
```

### Step 3 — Redeploy

After adding env vars, trigger a new deployment:

```bash
git add .
git commit -m "Add Brevo API email integration"
git push origin main
```

Vercel auto-deploys on push.

### Step 4 — Test on production

```bash
curl -X POST https://your-app.vercel.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":      "Test",
    "lastName":       "User",
    "role":           "employee",
    "personalEmail":  "test@gmail.com",
    "password":       "Test@1234",
    "confirmPassword":"Test@1234"
  }'
```

---

## 13. TROUBLESHOOTING

### Error: `Unauthorized — API key is missing`

```
Cause:  BREVO_API_KEY not loaded
Fix:    Check .env file has the key and dotenv is loaded before mailer.js
        Add: require('dotenv').config(); at top of server.js
```

### Error: `Sender email not validated`

```
Cause:  The EMAIL_FROM address hasn't been verified in Brevo
Fix:    Brevo dashboard → Senders → Add and verify the email address
        Use the same email as EMAIL_FROM in .env
```

### Error: `Daily sending limit reached`

```
Cause:  Exceeded 300 emails/day free tier
Fix:    Wait for reset at midnight UTC
        Or upgrade Brevo plan (paid) for more volume
```

### Error: `OTP email not received`

```
Check:  1. Spam/junk folder first
        2. Terminal shows "OTP email sent..." log
        3. Brevo dashboard → Logs → Transactional — see if email was sent
        4. Verify EMAIL_FROM is a validated sender in Brevo
```

### Error: `Cannot find module '@getbrevo/brevo'`

```bash
cd backend
npm install @getbrevo/brevo
```

### OTP always invalid

```
Cause:  OTP stored but compared incorrectly, or expired
Fix:    Check OTPToken.expiresAt is 10 min in the future
        Check mfaCode from frontend is sent as a string, not a number
        Check record.otp === mfaCode (both should be strings)
```

### Vercel: email works locally but not in production

```
Check:  1. BREVO_API_KEY added to Vercel env vars (not just .env)
        2. Redeployed after adding env vars
        3. Check Vercel function logs: Dashboard → your project → Functions → logs
```

---

## QUICK REFERENCE

### Brevo free tier limits

```
Emails per day:   300
Emails per month: 9,000
Credit card:      Never required
Expires:          Never
```

### Key files

```
backend/utils/mailer.js          Brevo API email utility
backend/models/OTPToken.js       OTP storage model
backend/controllers/authController.js  register, setupMFA, login, verifyMFA
backend/routes/auth.js           Route definitions
backend/.env                     API keys and config
```

### API endpoints

```
POST /api/v1/auth/register       Create account + send OTP/TOTP setup
POST /api/v1/auth/setup-mfa      Verify OTP/TOTP after registration
POST /api/v1/auth/resend-otp     Resend registration OTP (max 3 times)
POST /api/v1/auth/login          Password check + send login OTP
POST /api/v1/auth/verify-mfa     Verify login OTP/TOTP + return JWT
```

### MFA by role

```
employee   → Email OTP via Brevo (registration + login)
hr         → Email OTP via Brevo (registration + login)
admin      → TOTP via Authenticator app (speakeasy + qrcode)
superAdmin → TOTP via Authenticator app (speakeasy + qrcode)
```

---

*All tools used are free: Brevo (300 emails/day), speakeasy (npm), qrcode (npm), nodemailer not used — Brevo API SDK used instead.*  
*Compatible with: Vercel, Railway, Render, local Node.js*
