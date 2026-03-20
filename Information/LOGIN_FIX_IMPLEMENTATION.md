# Login Fix & Auto-Verify Implementation
## NetPair IMS — Solving "Invalid email or password" for All Users

**Problem:** Every new registered user gets `401 Invalid email or password` on login  
**Root Cause:** `isVerified: false` — OTP/MFA setup step never completes after registration  
**Solution:** Two-phase fix — immediate bypass now + proper OTP wiring later  
**Last Updated:** March 2026  

---

## TABLE OF CONTENTS

1. [Understanding the Problem](#1-understanding-the-problem)
2. [Phase 1 — Immediate Fix (Today)](#2-phase-1--immediate-fix-today)
3. [Phase 2 — Fix All Existing Broken Users](#3-phase-2--fix-all-existing-broken-users)
4. [Phase 3 — Seed Script for Fresh Users](#4-phase-3--seed-script-for-fresh-users)
5. [Phase 4 — Fix the Register Controller](#5-phase-4--fix-the-register-controller)
6. [Phase 5 — Fix the Login Controller](#6-phase-5--fix-the-login-controller)
7. [Phase 6 — Fix the User Model](#7-phase-6--fix-the-user-model)
8. [Phase 7 — Wire Proper OTP Verification Later](#8-phase-7--wire-proper-otp-verification-later)
9. [Testing Checklist](#9-testing-checklist)
10. [Quick Reference](#10-quick-reference)

---

## 1. UNDERSTANDING THE PROBLEM

### Why login fails for every user

```
User registers
    ↓
User document created in MongoDB
    ↓
isVerified: false  ← set by default
    ↓
MFA popup appears (OTP or TOTP)
    ↓
OTP email never arrives (Brevo not wired yet)
    OR
User closes popup without entering code
    ↓
setup-mfa endpoint never called
    ↓
isVerified stays false FOREVER
    ↓
User tries to login
    ↓
Login controller checks: if (!user.isVerified) → 401
    ↓
"Invalid email or password" shown
```

### Why the error message is misleading

The backend returns `"Invalid email or password"` for ALL login failures — including `isVerified: false` and `isActive: false`. This is intentional security practice (never tell attackers which field is wrong) but makes debugging harder.

### The two-phase solution

```
Phase 1 (now):    Auto-verify every new user on registration
                  → isVerified set to true immediately after register
                  → No OTP needed to log in during development

Phase 2 (later):  When Brevo OTP is fully wired, remove auto-verify
                  → Users complete OTP step → isVerified: true
                  → Production-ready MFA flow
```

---

## 2. PHASE 1 — IMMEDIATE FIX (TODAY)

### Step 1 — List all users to see current state

Run from `backend` folder:

```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');

  const users = await User.find(
    {},
    { systemEmail:1, isVerified:1, isActive:1, role:1, _id:0 }
  ).sort({ createdAt: -1 });

  if (users.length === 0) {
    console.log('NO USERS IN DATABASE');
  } else {
    console.log('ALL USERS (' + users.length + ' total):');
    console.log('─'.repeat(80));
    users.forEach(u => console.log(
      (u.systemEmail || 'NO EMAIL').padEnd(55),
      '| verified:', String(u.isVerified).padEnd(5),
      '| active:', String(u.isActive).padEnd(5),
      '| role:', u.role
    ));
  }

  process.exit();
});
"
```

### Expected output

```
ALL USERS (3 total):
────────────────────────────────────────────────────────────────────────────────
ashish.girase.employee@netpair.com                      | verified: false | active: true  | role: employee
priya.desai.hr@netpair.com                              | verified: false | active: true  | role: hr
dhruvitkumar.parmar.superadmin@netpair.com              | verified: true  | active: true  | role: superAdmin
```

### Step 2 — Fix ALL unverified users in one command

```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');

  const result = await User.updateMany(
    { isVerified: false },
    {
      \$set: {
        isVerified:  true,
        isActive:    true,
      }
    }
  );

  console.log('Fixed', result.modifiedCount, 'unverified user(s)');
  console.log('All users can now log in.');
  process.exit();
});
"
```

### Step 3 — Fix specific user + reset password

Use this when a specific user's password hash is also broken:

```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');

  // ── Change these two values ─────────────────────────
  const EMAIL    = 'ashish.girase.employee@netpair.com';
  const PASSWORD = 'Employee@1234';
  // ────────────────────────────────────────────────────

  const hash   = await bcrypt.hash(PASSWORD, 12);
  const result = await User.findOneAndUpdate(
    { systemEmail: EMAIL },
    {
      \$set: {
        password:   hash,
        isVerified: true,
        isActive:   true,
      }
    },
    { new: true }
  );

  if (result) {
    console.log('FIXED:', result.systemEmail);
    console.log('Login with password:', PASSWORD);
  } else {
    console.log('USER NOT FOUND — run the create script in Phase 3');
  }

  process.exit();
});
"
```

---

## 3. PHASE 2 — FIX ALL EXISTING BROKEN USERS

If you have many users registered during development with broken states, run this full repair script:

```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');

  // Get all users
  const users = await User.find({});
  console.log('Found', users.length, 'total users');

  let fixed = 0;

  for (const user of users) {
    const updates = {};

    // Fix isVerified
    if (!user.isVerified) {
      updates.isVerified = true;
    }

    // Fix isActive
    if (!user.isActive) {
      updates.isActive = true;
    }

    // Fix missing password
    if (!user.password || user.password.length < 20) {
      const defaultPass = user.role === 'superAdmin' ? 'Admin@1234' :
                          user.role === 'admin'       ? 'Admin@1234' :
                          user.role === 'hr'          ? 'Hr@1234'    :
                                                        'Employee@1234';
      updates.password = await bcrypt.hash(defaultPass, 12);
      console.log('Reset password for:', user.systemEmail, '→', defaultPass);
    }

    if (Object.keys(updates).length > 0) {
      await User.findByIdAndUpdate(user._id, { \$set: updates });
      fixed++;
    }
  }

  console.log('─'.repeat(50));
  console.log('Repaired', fixed, 'user(s)');
  console.log('Default passwords:');
  console.log('  superAdmin / admin → Admin@1234');
  console.log('  hr                 → Hr@1234');
  console.log('  employee           → Employee@1234');
  process.exit();
});
"
```

---

## 4. PHASE 3 — SEED SCRIPT FOR FRESH USERS

Create file: `backend/scripts/seed.js`

This script creates or repairs users. Run it any time during development.

```javascript
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Define seed users here ──────────────────────────────────────
const SEED_USERS = [
  {
    firstName:     'Dhruvitkumar',
    lastName:      'Parmar',
    role:          'superAdmin',
    systemEmail:   'dhruvitkumar.parmar.superadmin@netpair.com',
    personalEmail: 'dhruvitpc@gmail.com',
    password:      'Admin@1234',
    mfaMethod:     'totp',
  },
  {
    firstName:     'Ashish',
    lastName:      'Girase',
    role:          'employee',
    systemEmail:   'ashish.girase.employee@netpair.com',
    personalEmail: 'ashish@gmail.com',
    password:      'Employee@1234',
    mfaMethod:     'otp',
  },
  {
    firstName:     'Priya',
    lastName:      'Desai',
    role:          'hr',
    systemEmail:   'priya.desai.hr@netpair.com',
    personalEmail: 'priya@gmail.com',
    password:      'Hr@1234',
    mfaMethod:     'otp',
  },
  {
    firstName:     'Amit',
    lastName:      'Patel',
    role:          'admin',
    systemEmail:   'amit.patel.admin@netpair.com',
    personalEmail: 'amit@gmail.com',
    password:      'Admin@1234',
    mfaMethod:     'totp',
  },
];
// ───────────────────────────────────────────────────────────────

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.\n');

  const User = require('../models/User');

  console.log('Seeding', SEED_USERS.length, 'user(s)...');
  console.log('─'.repeat(60));

  for (const userData of SEED_USERS) {
    const hash = await bcrypt.hash(userData.password, 12);

    const existing = await User.findOne({ systemEmail: userData.systemEmail });

    if (existing) {
      await User.findByIdAndUpdate(existing._id, {
        \$set: {
          password:    hash,
          isVerified:  true,
          isActive:    true,
          personalEmail: userData.personalEmail,
        },
      });
      console.log('UPDATED :', userData.systemEmail);
    } else {
      await User.create({
        firstName:     userData.firstName,
        lastName:      userData.lastName,
        role:          userData.role,
        systemEmail:   userData.systemEmail,
        personalEmail: userData.personalEmail,
        password:      hash,
        mfaMethod:     userData.mfaMethod,
        isVerified:    true,
        isActive:      true,
      });
      console.log('CREATED :', userData.systemEmail);
    }
  }

  console.log('─'.repeat(60));
  console.log('\nSeed complete. Login credentials:\n');
  SEED_USERS.forEach(u => {
    console.log(
      u.role.padEnd(12),
      u.systemEmail.padEnd(52),
      u.password
    );
  });

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
```

### Add to `package.json` scripts

In `backend/package.json`:

```json
{
  "scripts": {
    "start":  "node server.js",
    "dev":    "nodemon server.js",
    "seed":   "node scripts/seed.js",
    "lint":   "eslint ."
  }
}
```

### Run seed any time

```bash
cd backend
npm run seed
```

---

## 5. PHASE 4 — FIX THE REGISTER CONTROLLER

### Add auto-verify flag during development

Open `backend/controllers/authController.js` and update the `register` function.

Find where `User.create()` is called and add `isVerified: true`:

```javascript
exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      role,
      personalEmail,
      password,
    } = req.body;

    // Generate system email
    const clean    = s => s.toLowerCase().trim().replace(/[^a-z]/g, '');
    const roleSlug = {
      employee:   'employee',
      hr:         'hr',
      admin:      'admin',
      superAdmin: 'superadmin',
    }[role];

    const baseEmail   = `${clean(firstName)}.${clean(lastName)}.${roleSlug}@netpair.com`;
    const systemEmail = await resolveEmailCollision(baseEmail);

    // Check duplicate personal email
    const emailExists = await User.findOne({
      personalEmail: personalEmail.toLowerCase().trim(),
    });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'This personal email is already registered',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // ── DEV FLAG ─────────────────────────────────────────────
    // Set isVerified: true so users can log in immediately
    // without completing OTP step.
    //
    // When Brevo OTP flow is fully working, change this to:
    //   isVerified: false
    // and uncomment the OTP sending code below.
    //
    const IS_DEV_AUTO_VERIFY = true; // ← change to false in production
    // ─────────────────────────────────────────────────────────

    // Create user
    const user = await User.create({
      firstName:    firstName.trim(),
      lastName:     lastName.trim(),
      role,
      systemEmail,
      personalEmail: personalEmail.toLowerCase().trim(),
      password:     hashedPassword,
      mfaMethod:    ['admin', 'superAdmin'].includes(role) ? 'totp' : 'otp',
      isVerified:   IS_DEV_AUTO_VERIFY, // ← true in dev, false in prod
      isActive:     true,
    });

    // ── OTP path (employee & hr) ─────────────────────────────
    // Only send OTP if NOT auto-verified
    if (!IS_DEV_AUTO_VERIFY && ['employee', 'hr'].includes(role)) {
      const otp = String(crypto.randomInt(100000, 999999));
      await OTPToken.create({
        userId:    user._id,
        otp,
        purpose:   'email_verification',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
      const { sendOTP } = require('../utils/mailer');
      await sendOTP(personalEmail, firstName, otp, 'verification');
    }

    // ── TOTP path (admin & superAdmin) ──────────────────────
    // Only generate QR if NOT auto-verified
    let qrCode = null;
    if (!IS_DEV_AUTO_VERIFY && ['admin', 'superAdmin'].includes(role)) {
      const speakeasy = require('speakeasy');
      const QRCode    = require('qrcode');
      const secret    = speakeasy.generateSecret({
        name:   `NetPair (${systemEmail})`,
        issuer: 'NetPair Infotech',
      });
      qrCode = await QRCode.toDataURL(secret.otpauth_url);
      await User.findByIdAndUpdate(user._id, { totpSecret: secret.base32 });
    }

    return res.status(200).json({
      success: true,
      message: IS_DEV_AUTO_VERIFY
        ? 'Account created. You can now log in.'
        : 'Account created. Check your email for the verification code.',
      data: {
        systemEmail,
        mfaMethod:    user.mfaMethod,
        tempUserId:   user._id,
        autoVerified: IS_DEV_AUTO_VERIFY,
        qrCode,       // null in dev mode
      },
    });

  } catch (err) {
    console.error('REGISTER ERROR:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Registration failed',
    });
  }
};
```

### Helper — resolve email collisions

Add this above the `register` function:

```javascript
async function resolveEmailCollision(baseEmail) {
  const [local, domain] = baseEmail.split('@');
  const pattern  = new RegExp(`^${local}(\\d*)@${domain}$`);
  const existing = await User.find({ systemEmail: { \$regex: pattern } });
  if (existing.length === 0) return baseEmail;
  return `${local}${existing.length + 1}@${domain}`;
}
```

---

## 6. PHASE 5 — FIX THE LOGIN CONTROLLER

Replace your entire login function with this version. Key fixes:
- `.toLowerCase().trim()` on email lookup
- Separate clear error messages in console (not exposed to user)
- Handles both `otp` and `totp` roles correctly

```javascript
exports.login = async (req, res) => {
  try {
    const { systemEmail, password } = req.body;

    // ── Input validation ─────────────────────────────────────
    if (!systemEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // ── Find user (case-insensitive) ─────────────────────────
    const user = await User.findOne({
      systemEmail: systemEmail.toLowerCase().trim(),
    });

    // Log for debugging — remove in production
    console.log('[LOGIN] Email:', systemEmail);
    console.log('[LOGIN] User found:', user ? 'YES' : 'NO');
    if (user) {
      console.log('[LOGIN] isVerified:', user.isVerified);
      console.log('[LOGIN] isActive:', user.isActive);
      console.log('[LOGIN] role:', user.role);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // ── Account status checks ────────────────────────────────
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Contact your administrator.',
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        // Show helpful message in dev — change to generic in production
        message: process.env.NODE_ENV === 'production'
          ? 'Invalid email or password'
          : 'Account not verified. Run: npm run seed  or contact admin.',
      });
    }

    // ── Password check ───────────────────────────────────────
    const passwordMatch = await bcrypt.compare(password, user.password);

    console.log('[LOGIN] Password match:', passwordMatch);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // ── Send OTP for employee & hr ───────────────────────────
    if (user.mfaMethod === 'otp') {
      try {
        const otp = String(crypto.randomInt(100000, 999999));

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

        const { sendOTP } = require('../utils/mailer');
        await sendOTP(user.personalEmail, user.firstName, otp, 'login');

      } catch (otpErr) {
        console.error('[LOGIN] OTP send error:', otpErr.message);
        // Do not block login if email fails — log and continue
      }
    }

    // ── Generate temp token (5 min) for MFA step ────────────
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
        ? 'Verification code sent to your registered email'
        : 'Enter the code from your authenticator app',
    });

  } catch (err) {
    console.error('[LOGIN] ERROR:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};
```

---

## 7. PHASE 6 — FIX THE USER MODEL

Open `backend/models/User.js` and update the `systemEmail` and `personalEmail` fields:

```javascript
const UserSchema = new mongoose.Schema({

  // ── Identity ─────────────────────────────────────────────
  systemEmail: {
    type:      String,
    unique:    true,
    required:  true,
    lowercase: true,  // auto-lowercase on save — prevents case mismatch
    trim:      true,  // auto-trim whitespace
    index:     true,  // fast lookups
  },

  personalEmail: {
    type:      String,
    required:  true,
    lowercase: true,
    trim:      true,
  },

  firstName: {
    type:     String,
    required: true,
    trim:     true,
  },

  lastName: {
    type:     String,
    required: true,
    trim:     true,
  },

  role: {
    type:     String,
    enum:     ['employee', 'hr', 'admin', 'superAdmin'],
    required: true,
    default:  'employee',
  },

  password: {
    type:     String,
    required: true,
    minlength: 8,
  },

  // ── Verification ─────────────────────────────────────────
  isVerified: {
    type:    Boolean,
    default: false,   // ← false in production, set to true in dev seed
  },

  isActive: {
    type:    Boolean,
    default: true,
  },

  // ── MFA ──────────────────────────────────────────────────
  mfaMethod: {
    type: String,
    enum: ['otp', 'totp'],
  },

  totpSecret:  { type: String },
  totpEnabled: { type: Boolean, default: false },

  backupCodes: [{
    hash: String,
    used: { type: Boolean, default: false },
  }],

  // ── Profile (filled post-login) ───────────────────────────
  profile: {
    avatar:       String,
    designation:  String,
    department:   String,
    phone:        String,
    dateOfBirth:  Date,
    gender:       { type: String, enum: ['male','female','other','prefer_not'] },
    address: {
      street:  String,
      city:    String,
      state:   String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    emergencyContact: {
      name:         String,
      relationship: String,
      phone:        String,
    },
    bio:        { type: String, maxlength: 250 },
    socialLinks: { linkedin: String },
    isComplete: { type: Boolean, default: false },
  },

  // ── Employment (set by HR/Admin) ──────────────────────────
  employment: {
    joiningDate:    Date,
    employeeId:     String,
    employmentType: {
      type: String,
      enum: ['fulltime','parttime','contract','intern'],
    },
    reportingTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },

  // ── Tokens ────────────────────────────────────────────────
  refreshTokens: [{
    token:     String,
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now },
  }],

  // ── Audit ─────────────────────────────────────────────────
  lastLogin: Date,

}, {
  timestamps: true, // adds createdAt and updatedAt automatically
});

// Index for fast login lookups
UserSchema.index({ systemEmail: 1 });
UserSchema.index({ personalEmail: 1 });
UserSchema.index({ role: 1 });

module.exports = mongoose.model('User', UserSchema);
```

---

## 8. PHASE 7 — WIRE PROPER OTP VERIFICATION LATER

When Brevo is fully set up and tested, switch from dev mode to production mode in two places:

### Change 1 — Register controller

```javascript
// Development (current)
const IS_DEV_AUTO_VERIFY = true;

// Production (when Brevo OTP is working)
const IS_DEV_AUTO_VERIFY = false;
```

### Change 2 — Login controller error message

```javascript
// Development (current — shows helpful message)
message: process.env.NODE_ENV === 'production'
  ? 'Invalid email or password'
  : 'Account not verified. Run: npm run seed',

// This automatically becomes generic in production
// when NODE_ENV=production is set in Vercel env vars
```

### Change 3 — Verify the full OTP flow works

```bash
# Test registration sends OTP email
curl -X POST http://localhost:3000/api/v1/auth/register \
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

```bash
# Test setup-mfa verifies OTP and sets isVerified: true
curl -X POST http://localhost:3000/api/v1/auth/setup-mfa \
  -H "Content-Type: application/json" \
  -d '{
    "tempUserId": "id-from-register-response",
    "mfaCode":    "123456"
  }'
```

Only switch `IS_DEV_AUTO_VERIFY` to `false` after both of these commands work end-to-end.

---

## 9. TESTING CHECKLIST

### After running Phase 1 fix

```
□  npm run seed (or node scripts/seed.js)
□  Restart backend: node server.js
□  Terminal shows: MongoDB connected
□  Try login: ashish.girase.employee@netpair.com / Employee@1234
□  Login succeeds → MFA screen appears
□  Try login: dhruvitkumar.parmar.superadmin@netpair.com / Admin@1234
□  Login succeeds → TOTP screen appears
```

### After Phase 4 (register controller fix)

```
□  Register a new employee account
□  Response includes: "autoVerified: true"
□  No OTP email sent (expected in dev mode)
□  Login immediately with new account
□  Login succeeds without any OTP step
```

### After Phase 5 (login controller fix)

```
□  Terminal shows [LOGIN] debug logs on each attempt
□  Correct password → proceeds to MFA screen
□  Wrong password → "Invalid email or password" shown
□  Wrong email → "Invalid email or password" shown
□  Unverified account → helpful dev message shown
```

### Before going to production

```
□  Change IS_DEV_AUTO_VERIFY to false
□  Test Brevo OTP email arrives in inbox
□  Test setup-mfa endpoint verifies OTP correctly
□  Test full flow: register → OTP → login → MFA
□  Remove all [LOGIN] console.log debug lines
□  Set NODE_ENV=production in Vercel env vars
```

---

## 10. QUICK REFERENCE

### Fix all broken users (one command)

```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  const r = await User.updateMany({ isVerified: false }, { \$set: { isVerified: true, isActive: true } });
  console.log('Fixed', r.modifiedCount, 'user(s) — all can now log in');
  process.exit();
});
"
```

### Fix one specific user + reset password

```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  const hash = await bcrypt.hash('Employee@1234', 12);
  const r = await User.findOneAndUpdate(
    { systemEmail: 'ashish.girase.employee@netpair.com' },
    { \$set: { password: hash, isVerified: true, isActive: true } },
    { upsert: true, new: true }
  );
  console.log('DONE:', r.systemEmail, '→ password: Employee@1234');
  process.exit();
});
"
```

### List all users

```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  const users = await User.find({}, { systemEmail:1, isVerified:1, isActive:1, role:1, _id:0 });
  users.forEach(u => console.log(u.systemEmail, '| verified:', u.isVerified, '| role:', u.role));
  process.exit();
});
"
```

### Run seed script

```bash
cd backend
npm run seed
```

### Default passwords after seed

| Role | Email | Password |
|------|-------|----------|
| superAdmin | dhruvitkumar.parmar.superadmin@netpair.com | Admin@1234 |
| admin | amit.patel.admin@netpair.com | Admin@1234 |
| hr | priya.desai.hr@netpair.com | Hr@1234 |
| employee | ashish.girase.employee@netpair.com | Employee@1234 |

### Key files changed

```
backend/controllers/authController.js   register() + login() — auto-verify flag
backend/models/User.js                  lowercase + trim on systemEmail
backend/scripts/seed.js                 seed script — run any time
backend/package.json                    added "seed" script
```

### Dev vs Production flag

```javascript
// backend/controllers/authController.js

const IS_DEV_AUTO_VERIFY = true;   // Development — no OTP needed
const IS_DEV_AUTO_VERIFY = false;  // Production  — OTP required
```

---

*Remove all console.log debug lines before deploying to production.*  
*Set `NODE_ENV=production` in Vercel environment variables.*  
*Switch `IS_DEV_AUTO_VERIFY` to `false` only after Brevo OTP flow is tested end-to-end.*
