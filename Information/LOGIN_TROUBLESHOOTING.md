# Login Troubleshooting Guide
## NetPair IMS — "Invalid email or password" Error

**Error:** `Invalid email or password` toast on login  
**Symptom:** Password is correct but login keeps failing  
**Applies to:** All roles — employee, hr, admin, superAdmin  
**Last Updated:** March 2026  

---

## TABLE OF CONTENTS

1. [Root Causes](#1-root-causes)
2. [Step 1 — Add Debug Logs](#2-step-1--add-debug-logs)
3. [Step 2 — Check MongoDB Directly](#3-step-2--check-mongodb-directly)
4. [Step 3 — Reset Password via Terminal](#4-step-3--reset-password-via-terminal)
5. [Step 4 — Fix isVerified / isActive](#5-step-4--fix-isverified--isactive)
6. [Step 5 — Create Fresh SuperAdmin](#6-step-5--create-fresh-superadmin)
7. [Step 6 — Fix the Login Controller](#7-step-6--fix-the-login-controller)
8. [Step 7 — Fix the Login Form (Frontend)](#8-step-7--fix-the-login-form-frontend)
9. [Prevention — Never Face This Again](#9-prevention--never-face-this-again)
10. [Quick Reference](#10-quick-reference)

---

## 1. ROOT CAUSES

When "Invalid email or password" appears even though the password is correct, one of these is the actual cause:

| # | Cause | How Common |
|---|-------|-----------|
| 1 | `systemEmail` stored differently in DB vs what you type | Very common |
| 2 | `isVerified: false` — MFA setup was never completed | Very common |
| 3 | `isActive: false` — account was deactivated | Common |
| 4 | Password hash corrupted — multiple registration attempts | Common |
| 5 | Login controller still uses old `username` or `email` field | Common after refactor |
| 6 | Frontend sends wrong field name in request body | Less common |
| 7 | User document does not exist in DB at all | Possible |

Work through the steps below in order — each step narrows down the cause.

---

## 2. STEP 1 — ADD DEBUG LOGS

This is the fastest way to find the exact cause. Add 4 console logs to your login controller.

Open `backend/controllers/authController.js` and update the `login` function:

```javascript
exports.login = async (req, res) => {

  // ── DEBUG BLOCK — remove after fixing ──────────────────────
  console.log('─────────────────────────────────────');
  console.log('LOGIN ATTEMPT');
  console.log('Email received :', req.body.systemEmail);
  console.log('Body received  :', JSON.stringify(req.body));
  // ────────────────────────────────────────────────────────────

  try {
    const { systemEmail, password } = req.body;

    const user = await User.findOne({ systemEmail });

    // ── DEBUG BLOCK ─────────────────────────────────────────
    console.log('User found     :', user ? 'YES' : 'NO — not in DB');
    console.log('Stored email   :', user?.systemEmail || 'N/A');
    console.log('isVerified     :', user?.isVerified);
    console.log('isActive       :', user?.isActive);
    console.log('mfaMethod      :', user?.mfaMethod);
    // ────────────────────────────────────────────────────────

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // ... rest of your login code
  }
};
```

### Read the terminal output

After adding the logs, **restart the backend** and submit the login form. The terminal will print one of these:

```
User found: NO — not in DB
→ Go to Step 3 (email mismatch or user does not exist)

User found: YES
isVerified: false
→ Go to Step 4 (account not verified)

User found: YES
isVerified: true
isActive: false
→ Go to Step 4 (account deactivated)

User found: YES
isVerified: true
isActive: true
→ Password hash is wrong — Go to Step 3 (reset password)
```

---

## 3. STEP 2 — CHECK MONGODB DIRECTLY

### Open MongoDB Atlas Collections

```
cloud.mongodb.com → your cluster → Collections
→ hr_management database → users collection
```

### Search for your user

In the filter bar, enter one of these:

```json
{ "systemEmail": { "$regex": "dhruvitkumar", "$options": "i" } }
```

Or search by personal email:

```json
{ "personalEmail": "dhruvitpc@gmail.com" }
```

Or find all users:

```json
{}
```

### What to check in the document

```
Field           Expected value
─────────────────────────────────────────────────────
systemEmail     dhruvitkumar.parmar.superadmin@netpair.com
isVerified      true
isActive        true
password        $2a$12$...  (must start with $2a$)
role            superAdmin
mfaMethod       totp
```

### Common findings

**Finding 1 — systemEmail is different from what you type**

```
Stored:  dhruvit.parmar.superadmin@netpair.com
Typed:   dhruvitkumar.parmar.superadmin@netpair.com
```

The email was generated from whatever name was entered at registration. Copy the exact stored `systemEmail` and use that to log in.

**Finding 2 — password field is missing or empty**

```
password: ""   or   password: null
```

The registration did not save the password. Go to Step 3.

**Finding 3 — multiple documents for the same person**

```
dhruvitkumar.parmar.superadmin@netpair.com   isVerified: false
dhruvitkumar.parmar.superadmin2@netpair.com  isVerified: true
```

Multiple registrations created duplicate entries. Delete all and go to Step 5 to create a clean one.

**Finding 4 — no documents at all**

```
No documents found
```

The user was never saved to the database. Go to Step 5.

---

## 4. STEP 3 — RESET PASSWORD VIA TERMINAL

Run this from the `backend` folder. Replace the email and new password as needed.

```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');

  const newPassword = 'Admin@1234';
  const hash        = await bcrypt.hash(newPassword, 12);

  const result = await User.findOneAndUpdate(
    { systemEmail: 'dhruvitkumar.parmar.superadmin@netpair.com' },
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
    console.log('SUCCESS — password reset for:', result.systemEmail);
    console.log('New password:', newPassword);
  } else {
    console.log('USER NOT FOUND — email does not exist in database');
    console.log('Run Step 5 to create a fresh superAdmin');
  }

  process.exit();
});
"
```

### Expected output

```
SUCCESS — password reset for: dhruvitkumar.parmar.superadmin@netpair.com
New password: Admin@1234
```

Now try logging in with password `Admin@1234`.

If output is `USER NOT FOUND` → the stored email is different. Run this to list all users and find the exact email:

```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  const users = await User.find({}, { systemEmail:1, isVerified:1, isActive:1, role:1 });
  console.log('ALL USERS:');
  users.forEach(u => console.log(
    u.systemEmail.padEnd(55),
    '| verified:', u.isVerified,
    '| active:', u.isActive,
    '| role:', u.role
  ));
  process.exit();
});
"
```

Copy the exact `systemEmail` from the output and use it to log in.

---

## 5. STEP 4 — FIX isVerified / isActive

If the user exists but `isVerified: false` or `isActive: false`, run this:

```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');

  const result = await User.findOneAndUpdate(
    { systemEmail: 'dhruvitkumar.parmar.superadmin@netpair.com' },
    {
      \$set: {
        isVerified:  true,
        isActive:    true,
        totpEnabled: true,
      }
    },
    { new: true }
  );

  console.log(result
    ? 'FIXED: ' + result.systemEmail + ' is now verified and active'
    : 'USER NOT FOUND'
  );
  process.exit();
});
"
```

---

## 6. STEP 5 — CREATE FRESH SUPERADMIN

If no user exists or all previous attempts are corrupted, delete everything and create a clean superAdmin:

### Delete all existing user documents (clean slate)

```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  const deleted = await User.deleteMany({});
  console.log('Deleted', deleted.deletedCount, 'user(s)');
  process.exit();
});
"
```

### Create fresh superAdmin

```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');

  const hash = await bcrypt.hash('Admin@1234', 12);

  const user = await User.create({
    firstName:     'Dhruvitkumar',
    lastName:      'Parmar',
    role:          'superAdmin',
    systemEmail:   'dhruvitkumar.parmar.superadmin@netpair.com',
    personalEmail: 'dhruvitpc@gmail.com',
    password:      hash,
    mfaMethod:     'totp',
    isVerified:    true,
    isActive:      true,
  });

  console.log('─────────────────────────────────────');
  console.log('SuperAdmin created successfully');
  console.log('Login email :', user.systemEmail);
  console.log('Password    : Admin@1234');
  console.log('Role        :', user.role);
  console.log('─────────────────────────────────────');
  process.exit();
});
"
```

### Login credentials after this step

```
Email:    dhruvitkumar.parmar.superadmin@netpair.com
Password: Admin@1234
```

---

## 7. STEP 6 — FIX THE LOGIN CONTROLLER

If the user exists in the DB and password is correct but login still fails, the controller itself has a bug. Replace your entire login function with this clean version:

```javascript
const User     = require('../models/User');
const OTPToken = require('../models/OTPToken');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');

exports.login = async (req, res) => {
  try {
    const { systemEmail, password } = req.body;

    // ── Validate input ──────────────────────────────────────
    if (!systemEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // ── Find user ───────────────────────────────────────────
    const user = await User.findOne({
      systemEmail: systemEmail.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // ── Check account status ────────────────────────────────
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Contact your administrator.',
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Account not verified. Complete MFA setup first.',
      });
    }

    // ── Verify password ─────────────────────────────────────
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // ── OTP roles — send login OTP ──────────────────────────
    if (user.mfaMethod === 'otp') {
      const otp = String(crypto.randomInt(100000, 999999));

      // Invalidate previous login OTPs
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

      // Send OTP email
      try {
        const { sendOTP } = require('../utils/mailer');
        await sendOTP(user.personalEmail, user.firstName, otp, 'login');
      } catch (mailErr) {
        console.error('OTP email error:', mailErr.message);
        // Don't block login if email fails — log and continue
      }
    }

    // ── Generate short-lived temp token ─────────────────────
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
    console.error('LOGIN ERROR:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};
```

### Key fix in this version

The user lookup uses `.toLowerCase().trim()` on the email:

```javascript
const user = await User.findOne({
  systemEmail: systemEmail.toLowerCase().trim(),
});
```

This handles cases where the user types the email with a capital letter or accidental space — which would cause a mismatch against the lowercase stored email.

---

## 8. STEP 7 — FIX THE LOGIN FORM (FRONTEND)

If the backend logs show the request never arrives or `req.body` is empty, the frontend is sending the wrong field name.

Open `src/components/login/Lform.jsx` and check the fetch/axios call:

### Wrong (old field names)

```javascript
// BAD — old field names from username-based system
body: JSON.stringify({
  email:    systemEmail,   // wrong field name
  username: systemEmail,   // wrong field name
})
```

### Correct

```javascript
// GOOD — must match exactly what the controller reads
body: JSON.stringify({
  systemEmail: systemEmail,   // must be exactly 'systemEmail'
  password:    password,
})
```

### Full correct login submit function

```javascript
const onSubmit = async (data) => {
  setIsLoading(true);
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemEmail: data.systemEmail.toLowerCase().trim(),
          password:    data.password,
        }),
      }
    );

    const json = await response.json();

    if (!json.success) {
      toast.error(json.message);
      return;
    }

    // Store temp token and move to MFA step
    setTempToken(json.tempToken);
    setMfaMethod(json.mfaMethod);
    setStep('mfa');

    if (json.mfaMethod === 'otp') {
      toast.info('Verification code sent to your email');
    }

  } catch (err) {
    toast.error('Cannot connect to server. Check your connection.');
  } finally {
    setIsLoading(false);
  }
};
```

---

## 9. PREVENTION — NEVER FACE THIS AGAIN

### Add a seed script to your project

Create `backend/scripts/seed.js` — run this any time you need a clean working admin:

```javascript
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const SEED_USERS = [
  {
    firstName:     'Dhruvitkumar',
    lastName:      'Parmar',
    role:          'superAdmin',
    systemEmail:   'dhruvitkumar.parmar.superadmin@netpair.com',
    personalEmail: 'dhruvitpc@gmail.com',
    password:      'Admin@1234',
    mfaMethod:     'totp',
    isVerified:    true,
    isActive:      true,
  },
  // Add more seed users here as needed
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('../models/User');

  console.log('Seeding users...');

  for (const userData of SEED_USERS) {
    const existing = await User.findOne({ systemEmail: userData.systemEmail });

    if (existing) {
      // Update existing — fix verification and password
      const hash = await bcrypt.hash(userData.password, 12);
      await User.findByIdAndUpdate(existing._id, {
        password:   hash,
        isVerified: true,
        isActive:   true,
      });
      console.log('UPDATED :', userData.systemEmail);
    } else {
      // Create new
      const hash = await bcrypt.hash(userData.password, 12);
      await User.create({ ...userData, password: hash });
      console.log('CREATED :', userData.systemEmail);
    }
  }

  console.log('─────────────────────────────────────');
  console.log('Seeding complete.');
  console.log('Login:', SEED_USERS[0].systemEmail);
  console.log('Pass :', SEED_USERS[0].password);
  process.exit();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
```

Run it any time with:

```bash
cd backend
node scripts/seed.js
```

### Add .toLowerCase() when saving systemEmail

In `authController.js` register function, always save the email as lowercase:

```javascript
const user = await User.create({
  ...
  systemEmail: systemEmail.toLowerCase(),
  ...
});
```

### Add .toLowerCase() when querying

In `authController.js` login function:

```javascript
const user = await User.findOne({
  systemEmail: systemEmail.toLowerCase().trim(),
});
```

### Store systemEmail as lowercase in Mongoose schema

In `backend/models/User.js`:

```javascript
systemEmail: {
  type:      String,
  unique:    true,
  required:  true,
  lowercase: true,   // Mongoose auto-lowercases on save
  trim:      true,   // Mongoose auto-trims whitespace
},
```

This makes the email case-insensitive at the database level — the most reliable fix.

---

## 10. QUICK REFERENCE

### Decision tree

```
"Invalid email or password" shown
│
├── Add debug logs → restart server → try login
│
├── Terminal: "User found: NO"
│   ├── List all users → copy exact stored email
│   └── If no users at all → Run Step 5 (create fresh superAdmin)
│
├── Terminal: "User found: YES, isVerified: false"
│   └── Run Step 4 (fix isVerified)
│
├── Terminal: "User found: YES, isActive: false"
│   └── Run Step 4 (fix isActive)
│
└── Terminal: "User found: YES, isVerified: true, isActive: true"
    └── Password hash mismatch → Run Step 3 (reset password)
```

### One-command fix (covers all cases)

If you just want it working right now, run Step 5 which handles everything:
- Sets correct password hash
- Sets `isVerified: true`
- Sets `isActive: true`
- Creates user if it does not exist

```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  const hash = await bcrypt.hash('Admin@1234', 12);
  const result = await User.findOneAndUpdate(
    { systemEmail: 'dhruvitkumar.parmar.superadmin@netpair.com' },
    { \$set: { password: hash, isVerified: true, isActive: true } },
    { upsert: true, new: true }
  );
  console.log('DONE — login with Admin@1234');
  process.exit();
});
"
```

### Test credentials after any fix

```
Email:    dhruvitkumar.parmar.superadmin@netpair.com
Password: Admin@1234
```

### Files involved

```
backend/controllers/authController.js   login() and register() functions
backend/models/User.js                  systemEmail field — add lowercase:true
backend/scripts/seed.js                 seed script — create any time
src/components/login/Lform.jsx          frontend — field name must be systemEmail
```

---

*Remove all console.log debug blocks after the issue is resolved.*  
*Add `lowercase: true` and `trim: true` to the systemEmail field in User.js to prevent this permanently.*
