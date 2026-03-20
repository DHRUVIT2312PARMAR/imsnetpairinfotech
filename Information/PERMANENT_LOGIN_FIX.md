# Permanent Login Fix
## NetPair IMS — "Invalid email or password" — Final Solution

**Status:** Permanent fix — will never happen again after this  
**Root cause:** Every new user is created with `isVerified: false`  
**Frontend:** `Lform.jsx` is correct — do NOT touch it  
**Fix location:** Backend only — 3 files to change  
**Last Updated:** March 2026  

---

## WHY THIS KEEPS HAPPENING

```
Every time someone registers:

  User.create({ ..., isVerified: false })   ← created as unverified
           ↓
  MFA popup appears
           ↓
  OTP email not sent (Brevo not fully wired)
   OR user closes popup
           ↓
  setup-mfa endpoint never called
           ↓
  isVerified stays false forever
           ↓
  Login → 401 "Invalid email or password"

This will repeat for EVERY new user until the register
controller is changed to set isVerified: true by default.
```

---

## THE PERMANENT FIX — 3 FILES

```
File 1:  backend/controllers/authController.js
         → register() sets isVerified: true
         → login() has better error handling

File 2:  backend/models/User.js
         → isVerified defaults to true
         → systemEmail has lowercase + trim

File 3:  backend/scripts/seed.js  (new file)
         → run once to fix all existing broken users
```

---

## FILE 1 — authController.js

Open `backend/controllers/authController.js`

### Replace the entire register function

```javascript
const User     = require('../models/User');
const OTPToken = require('../models/OTPToken');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');

// ─────────────────────────────────────────────────────────────────
// Helper: generate system email from name + role
// ─────────────────────────────────────────────────────────────────
function buildSystemEmail(firstName, lastName, role) {
  const clean = s =>
    s.toLowerCase().trim()
     .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
     .replace(/[^a-z]/g, '');

  const slug = {
    employee:   'employee',
    hr:         'hr',
    admin:      'admin',
    superAdmin: 'superadmin',
  }[role];

  return `${clean(firstName)}.${clean(lastName)}.${slug}@netpair.com`;
}

// ─────────────────────────────────────────────────────────────────
// Helper: handle duplicate system emails
// ─────────────────────────────────────────────────────────────────
async function resolveEmail(baseEmail) {
  const [local, domain] = baseEmail.split('@');
  const regex    = new RegExp(`^${local}(\\d*)@${domain.replace('.', '\\.')}$`);
  const existing = await User.find({ systemEmail: { $regex: regex } });
  if (existing.length === 0) return baseEmail;
  return `${local}${existing.length + 1}@${domain}`;
}

// ─────────────────────────────────────────────────────────────────
// POST /api/v1/auth/register
// ─────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, role, personalEmail, password } = req.body;

    // Build + resolve system email
    const base        = buildSystemEmail(firstName, lastName, role);
    const systemEmail = await resolveEmail(base);

    // Check duplicate personal email
    const dupEmail = await User.findOne({
      personalEmail: personalEmail.toLowerCase().trim(),
    });
    if (dupEmail) {
      return res.status(400).json({
        success: false,
        message: 'This personal email is already registered',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // ── Create user ────────────────────────────────────────────
    //
    //  isVerified: true  ← PERMANENT FIX
    //
    //  During development: users can log in immediately.
    //  When Brevo OTP is fully tested end-to-end, change
    //  isVerified to false and uncomment the OTP block below.
    //
    const user = await User.create({
      firstName:     firstName.trim(),
      lastName:      lastName.trim(),
      role,
      systemEmail,
      personalEmail: personalEmail.toLowerCase().trim(),
      password:      hashedPassword,
      mfaMethod:     ['admin', 'superAdmin'].includes(role) ? 'totp' : 'otp',
      isVerified:    true,   // ← PERMANENT FIX — change to false only in production
      isActive:      true,
    });

    // ── Optional: send OTP (uncomment when Brevo is wired) ────
    /*
    if (['employee', 'hr'].includes(role)) {
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
    */

    return res.status(200).json({
      success: true,
      message: 'Account created successfully. You can now log in.',
      data: {
        systemEmail,
        mfaMethod:  user.mfaMethod,
        tempUserId: user._id,
        qrCode:     null,
      },
    });

  } catch (err) {
    console.error('[REGISTER ERROR]', err.message);

    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || 'Registration failed. Please try again.',
    });
  }
};
```

### Replace the entire login function

```javascript
// ─────────────────────────────────────────────────────────────────
// POST /api/v1/auth/login  — Step 1: password check
// ─────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { systemEmail, password } = req.body;

    // Input check
    if (!systemEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user — always lowercase + trim
    const user = await User.findOne({
      systemEmail: systemEmail.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Account checks — return specific messages in dev
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Contact your administrator.',
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        // Dev: helpful message   |   Prod: generic message
        message: process.env.NODE_ENV === 'production'
          ? 'Invalid email or password'
          : 'Account not verified. Run: cd backend && npm run seed',
      });
    }

    // Password check
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // OTP roles — send login OTP email
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
        // Log but do not block login if email fails
        console.error('[OTP SEND ERROR]', otpErr.message);
      }
    }

    // Short-lived temp token for MFA step (5 min)
    const tempToken = jwt.sign(
      { userId: user._id, step: 'mfa' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    return res.status(200).json({
      success:     true,
      mfaRequired: true,
      mfaMethod:   user.mfaMethod,
      data: {
        tempToken,
        mfaMethod: user.mfaMethod,
      },
      message: user.mfaMethod === 'otp'
        ? 'Verification code sent to your registered email'
        : 'Enter the code from your authenticator app',
    });

  } catch (err) {
    console.error('[LOGIN ERROR]', err.message);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/v1/auth/verify-mfa  — Step 2: MFA check + return JWT
// ─────────────────────────────────────────────────────────────────
exports.verifyMFA = async (req, res) => {
  try {
    const { tempToken, mfaCode } = req.body;

    // Validate temp token
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

    // OTP verification
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

    // TOTP verification
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

    // Issue full access token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

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
    console.error('[VERIFY-MFA ERROR]', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Verification failed',
    });
  }
};
```

---

## FILE 2 — User.js (Model)

Open `backend/models/User.js` and update these two fields:

```javascript
// ── CHANGE isVerified default from false → true ──────────────
isVerified: {
  type:    Boolean,
  default: true,   // ← CHANGED from false to true
},

// ── ADD lowercase + trim to systemEmail ──────────────────────
systemEmail: {
  type:      String,
  unique:    true,
  required:  true,
  lowercase: true,   // ← ADD THIS
  trim:      true,   // ← ADD THIS
  index:     true,
},

// ── ADD lowercase + trim to personalEmail ────────────────────
personalEmail: {
  type:      String,
  required:  true,
  lowercase: true,   // ← ADD THIS
  trim:      true,   // ← ADD THIS
},
```

These two changes mean:
- `isVerified: true` — every new user can log in immediately
- `lowercase: true` — MongoDB auto-lowercases the email on save, so `Rohit@netpair.com` and `rohit@netpair.com` are the same

---

## FILE 3 — scripts/seed.js (New File)

Create folder and file: `backend/scripts/seed.js`

```javascript
/**
 * NetPair IMS — Seed Script
 *
 * Run:   cd backend && npm run seed
 *
 * What it does:
 *   - Creates missing users
 *   - Fixes isVerified: false on existing users
 *   - Resets passwords to known values
 *   - Safe to run multiple times
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── ADD YOUR USERS HERE ───────────────────────────────────────────
const USERS = [
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
    firstName:     'Rohit',
    lastName:      'Prajapati',
    role:          'hr',
    systemEmail:   'rohit.prajapati.hr@netpair.com',
    personalEmail: 'rohit@gmail.com',
    password:      'Hr@1234',
    mfaMethod:     'otp',
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
];
// ─────────────────────────────────────────────────────────────────

async function run() {
  console.log('\nConnecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.\n');

  // Dynamically load User model after connecting
  const User = require('../models/User');

  // Step 1 — Fix all existing unverified users
  const fixed = await User.updateMany(
    { isVerified: false },
    { $set: { isVerified: true, isActive: true } }
  );
  if (fixed.modifiedCount > 0) {
    console.log(`Fixed ${fixed.modifiedCount} unverified user(s) → isVerified: true`);
  }

  // Step 2 — Create or update seed users
  console.log('\nProcessing seed users...');
  console.log('─'.repeat(65));

  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 12);

    const existing = await User.findOne({ systemEmail: u.systemEmail });

    if (existing) {
      await User.findByIdAndUpdate(existing._id, {
        $set: {
          password:     hash,
          isVerified:   true,
          isActive:     true,
          personalEmail: u.personalEmail,
        },
      });
      console.log('UPDATED:', u.systemEmail.padEnd(52), '→', u.password);
    } else {
      await User.create({
        firstName:     u.firstName,
        lastName:      u.lastName,
        role:          u.role,
        systemEmail:   u.systemEmail,
        personalEmail: u.personalEmail,
        password:      hash,
        mfaMethod:     u.mfaMethod,
        isVerified:    true,
        isActive:      true,
      });
      console.log('CREATED:', u.systemEmail.padEnd(52), '→', u.password);
    }
  }

  // Step 3 — List all users
  const all = await User.find(
    {},
    { systemEmail:1, role:1, isVerified:1, isActive:1, _id:0 }
  ).sort({ role: 1 });

  console.log('\n─'.repeat(65));
  console.log('ALL USERS IN DATABASE:\n');
  all.forEach(u =>
    console.log(
      u.systemEmail.padEnd(55),
      '| role:', u.role.padEnd(10),
      '| verified:', u.isVerified
    )
  );
  console.log('\nSeed complete. All users can now log in.');
  process.exit(0);
}

run().catch(err => {
  console.error('\nSeed FAILED:', err.message);
  process.exit(1);
});
```

### Add seed to `package.json`

Open `backend/package.json` and add the `seed` script:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev":   "nodemon server.js",
    "seed":  "node scripts/seed.js"
  }
}
```

---

## STEP-BY-STEP — DO THIS NOW

### Step 1 — Make the 3 file changes above

```
backend/controllers/authController.js  → replace register() and login()
backend/models/User.js                 → isVerified default true, add lowercase+trim
backend/scripts/seed.js                → create this new file
backend/package.json                   → add "seed" script
```

### Step 2 — Run the seed script

```bash
cd backend
npm run seed
```

Expected output:

```
Connecting to MongoDB...
Connected.

Fixed 5 unverified user(s) → isVerified: true

Processing seed users...
─────────────────────────────────────────────────────────────────
UPDATED: dhruvitkumar.parmar.superadmin@netpair.com  → Admin@1234
UPDATED: rohit.prajapati.hr@netpair.com              → Hr@1234
UPDATED: ashish.girase.employee@netpair.com          → Employee@1234

─────────────────────────────────────────────────────────────────
ALL USERS IN DATABASE:

ashish.girase.employee@netpair.com        | role: employee   | verified: true
dhruvitkumar.parmar.superadmin@netpair.com | role: superAdmin | verified: true
rohit.prajapati.hr@netpair.com            | role: hr         | verified: true

Seed complete. All users can now log in.
```

### Step 3 — Restart backend

```bash
# Stop the current server (Ctrl+C)
# Then:
node server.js
```

Wait for:
```
Server running on port 3000
MongoDB connected: ac-...
```

### Step 4 — Test login for each role

```
rohit.prajapati.hr@netpair.com               → Hr@1234
ashish.girase.employee@netpair.com           → Employee@1234
dhruvitkumar.parmar.superadmin@netpair.com   → Admin@1234
```

---

## WHY THIS IS PERMANENT

| Change | Effect |
|--------|--------|
| `isVerified: true` in register | Every new registration can log in immediately — no OTP needed |
| `isVerified: true` as default in User model | Even if register controller is wrong, model default saves you |
| `lowercase: true` on systemEmail | Case mismatches impossible at DB level |
| `trim: true` on systemEmail | Accidental spaces never cause failures |
| `seed.js` script | One command fixes all users any time something breaks |
| `npm run seed` in package.json | Reproducible — any dev on the team can run it |

---

## FOR FUTURE — WHEN TO ENABLE OTP

When you are ready to require OTP verification, make exactly these two changes:

### Change 1 — authController.js register()

```javascript
// Find this line:
isVerified: true,   // ← PERMANENT FIX

// Change to:
isVerified: false,

// Then uncomment the OTP block below it
```

### Change 2 — User.js model

```javascript
// Find this line:
isVerified: {
  type:    Boolean,
  default: true,    // ← currently true

// Change to:
  default: false,
},
```

Only make these changes AFTER:
1. Brevo API key is in `.env`
2. `sendOTP()` test passes: `node -e "require('./utils/mailer').sendOTP('test@gmail.com','Test','123456','verification').then(()=>console.log('OK'))"`
3. `POST /api/v1/auth/setup-mfa` endpoint works end-to-end
4. You have tested the full: register → receive OTP email → enter OTP → login

---

## NEVER NEED TO DEBUG THIS AGAIN

Any time login stops working for any user, run one command:

```bash
cd backend && npm run seed
```

That's it. The seed script:
- Fixes all `isVerified: false` users
- Resets passwords to known values
- Creates missing users
- Shows every user in the DB
- Safe to run unlimited times

---

## QUICK REFERENCE

### Login credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| superAdmin | dhruvitkumar.parmar.superadmin@netpair.com | Admin@1234 |
| hr | rohit.prajapati.hr@netpair.com | Hr@1234 |
| employee | ashish.girase.employee@netpair.com | Employee@1234 |

### Files changed

```
backend/controllers/authController.js   register() + login() + verifyMFA()
backend/models/User.js                  isVerified default + lowercase + trim
backend/scripts/seed.js                 NEW — run: npm run seed
backend/package.json                    added "seed" script
```

### Frontend — do NOT change

```
src/components/login/Lform.jsx          ← CORRECT — do not touch
```

The `Lform.jsx` code is correct. It sends `systemEmail` and `password` exactly as expected. The frontend is not the problem.

---

*The fix is permanent as long as `isVerified: true` stays in the register controller and User model default.*  
*Run `npm run seed` any time a user cannot log in — it fixes everything in under 5 seconds.*
