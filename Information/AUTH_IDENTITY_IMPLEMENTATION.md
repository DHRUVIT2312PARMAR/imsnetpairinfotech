# Auth & Identity Implementation Guide
## NetPair IMS — Role-Based Email, MFA, and Profile System

**Version:** 1.0.0  
**Scope:** Registration · Login · MFA · Profile Completion  
**Depends on:** Pure RBAC (Model 1), MongoDB, Express, React 19, Nodemailer, TOTP library  

---

## TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Email Identity Scheme](#2-email-identity-scheme)
3. [Registration Flow](#3-registration-flow)
4. [MFA Strategy by Role](#4-mfa-strategy-by-role)
5. [Login Flow](#5-login-flow)
6. [Profile Completion Flow](#6-profile-completion-flow)
7. [Database Schema](#7-database-schema)
8. [API Endpoints](#8-api-endpoints)
9. [Frontend — Registration Form](#9-frontend--registration-form)
10. [Frontend — Login Form](#10-frontend--login-form)
11. [Frontend — Profile Page](#11-frontend--profile-page)
12. [Security Considerations](#12-security-considerations)
13. [Environment Variables](#13-environment-variables)

---

## 1. SYSTEM OVERVIEW

### Identity Architecture

Every NetPair user gets a **system-generated email** based on their name and role. This email is their permanent login credential and implicitly carries their role — no separate role lookup needed at login.

```
Registration Input          →   Generated Identity
────────────────────────────────────────────────────
firstName: "Rahul"              rahul.shah.employee@netpair.com
lastName:  "Shah"               rahul.shah.hr@netpair.com
role:      "employee"           rahul.shah.admin@netpair.com
                                rahul.shah.superadmin@netpair.com
```

### What happens at each stage

```
REGISTRATION
  ├── User fills: First Name, Last Name, Role, Password, Confirm Password, Personal Email
  ├── System generates: name.surname.role@netpair.com
  ├── Popup shows generated email to user (copy to clipboard)
  ├── MFA setup triggered based on role
  │     ├── employee / hr   → OTP sent to personal email
  │     └── admin / superAdmin → Authenticator app TOTP setup
  └── Account created, email verified, user redirected to login

LOGIN
  ├── User enters: generated email + password
  ├── System reads role directly from email suffix
  ├── Verifies MFA (OTP or TOTP)
  └── Redirects to correct role dashboard

PROFILE (post-login)
  ├── User completes: designation, department, profile image, phone, etc.
  └── All non-identity info lives here — not in registration
```

---

## 2. EMAIL IDENTITY SCHEME

### Format

```
{firstName}.{lastName}.{role}@netpair.com
```

### Generation Rules

```javascript
function generateNetpairEmail(firstName, lastName, role) {
  const clean = str =>
    str.toLowerCase()
       .trim()
       .replace(/\s+/g, '')          // remove spaces
       .replace(/[^a-z]/g, '')       // remove non-alpha characters
       .normalize('NFD')
       .replace(/[\u0300-\u036f]/g, ''); // remove diacritics (é → e)

  const roleSlug = {
    employee:   'employee',
    hr:         'hr',
    admin:      'admin',
    superAdmin: 'superadmin',
  }[role];

  return `${clean(firstName)}.${clean(lastName)}.${roleSlug}@netpair.com`;
}

// Examples
generateNetpairEmail('Rahul', 'Shah', 'employee')
// → rahul.shah.employee@netpair.com

generateNetpairEmail('Priya', 'Desai', 'hr')
// → priya.desai.hr@netpair.com

generateNetpairEmail('Amit', 'Patel', 'admin')
// → amit.patel.admin@netpair.com

generateNetpairEmail('Sanjay', 'Mehta', 'superAdmin')
// → sanjay.mehta.superadmin@netpair.com
```

### Collision Handling

Two employees can have the same name. When a collision is detected, append a numeric suffix:

```javascript
async function resolveEmailCollision(baseEmail, db) {
  const existing = await db.users.find(
    { systemEmail: { $regex: `^${baseEmail.replace('@', '(\\d+)?@')}` } }
  ).toArray();

  if (existing.length === 0) return baseEmail;

  // rahul.shah.employee@netpair.com → rahul.shah.employee2@netpair.com
  const [local, domain] = baseEmail.split('@');
  return `${local}${existing.length + 1}@${domain}`;
}
```

### Role Extraction at Login

```javascript
function extractRoleFromEmail(email) {
  // email format: firstname.lastname.role@netpair.com
  const local = email.split('@')[0];          // "rahul.shah.employee"
  const parts = local.split('.');              // ["rahul", "shah", "employee"]
  const roleSlug = parts[parts.length - 1];   // "employee"

  const roleMap = {
    employee:   'employee',
    hr:         'hr',
    admin:      'admin',
    superadmin: 'superAdmin',
  };

  return roleMap[roleSlug] ?? null;
}
```

---

## 3. REGISTRATION FLOW

### Step-by-Step Flow

```
Step 1 — Form Input
  User fills:
    ├── First Name        (text, required)
    ├── Last Name         (text, required)
    ├── Role              (dropdown: Employee | HR | Admin | Super Admin)
    ├── Personal Email    (email, required — used for OTP or notifications)
    ├── Password          (min 8 chars, complexity required)
    └── Confirm Password  (must match)

Step 2 — Client-side Preview
  As user types firstName + lastName + role:
    └── Live preview shows: "Your login ID will be rahul.shah.employee@netpair.com"

Step 3 — Form Submit
  POST /api/v1/auth/register
    ├── Validate all fields
    ├── Generate system email
    ├── Check for collisions → resolve
    ├── Hash password (bcrypt, 12 rounds)
    └── Create user record (isVerified: false)

Step 4 — Generated Email Popup
  Modal displays:
    ├── "Your NetPair login email has been created"
    ├── Large display: rahul.shah.employee@netpair.com
    ├── Copy to clipboard button
    └── "Please save this — you will use it to log in"

Step 5 — MFA Setup (triggered from popup)
  employee / hr:
    ├── OTP (6-digit) sent to personal email
    └── User enters OTP in verification field → account activated

  admin / superAdmin:
    ├── QR code displayed for Authenticator app (Google Auth / Authy)
    ├── User scans QR → enters 6-digit TOTP to confirm setup
    └── Backup codes shown once → user must save them

Step 6 — Redirect
  └── All roles → /login (with success toast: "Account created. Please log in.")
```

### Registration Validation Rules

```
firstName:       required, 2–50 chars, letters only
lastName:        required, 2–50 chars, letters only
role:            required, enum: employee | hr | admin | superAdmin
personalEmail:   required, valid email format, not a @netpair.com address
password:        min 8 chars, must contain uppercase + lowercase + number + special char
confirmPassword: must exactly match password
```

---

## 4. MFA STRATEGY BY ROLE

### Overview

| Role | MFA Method | Verification at Registration | Verification at Login |
|---|---|---|---|
| employee | Email OTP | OTP to personalEmail | OTP to personalEmail |
| hr | Email OTP | OTP to personalEmail | OTP to personalEmail |
| admin | Authenticator TOTP | QR code scan + confirm | 6-digit TOTP |
| superAdmin | Authenticator TOTP | QR code scan + confirm | 6-digit TOTP |

### Email OTP (employee & hr)

```javascript
// Generate OTP
const crypto = require('crypto');

function generateOTP() {
  return String(crypto.randomInt(100000, 999999)); // 6-digit
}

// Store OTP in DB with expiry
await db.otpTokens.insertOne({
  userId:    user._id,
  otp:       await bcrypt.hash(otpCode, 10), // hash OTP before storing
  purpose:   'email_verification',           // or 'login_mfa'
  expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  used:      false,
});

// Send via Nodemailer
await transporter.sendMail({
  from:    '"NetPair IMS" <noreply@netpair.com>',
  to:      user.personalEmail,
  subject: 'Your NetPair verification code',
  html: `
    <p>Your one-time verification code is:</p>
    <h2 style="letter-spacing:8px;font-size:32px">${otpCode}</h2>
    <p>Valid for 10 minutes. Do not share this code.</p>
  `,
});

// Verify OTP
async function verifyOTP(userId, inputOtp) {
  const record = await db.otpTokens.findOne({
    userId,
    purpose: 'email_verification',
    used:    false,
    expiresAt: { $gt: new Date() },
  });

  if (!record) throw new Error('OTP expired or not found');
  const valid = await bcrypt.compare(inputOtp, record.otp);
  if (!valid) throw new Error('Invalid OTP');

  await db.otpTokens.updateOne({ _id: record._id }, { $set: { used: true } });
  return true;
}
```

### Authenticator App TOTP (admin & superAdmin)

```javascript
// Install: npm install speakeasy qrcode

const speakeasy = require('speakeasy');
const QRCode    = require('qrcode');

// Step 1 — Generate secret during registration
function generateTOTPSecret(userEmail) {
  const secret = speakeasy.generateSecret({
    name:   `NetPair IMS (${userEmail})`,
    issuer: 'NetPair Infotech',
    length: 32,
  });
  return secret; // save secret.base32 to DB
}

// Step 2 — Generate QR code to display in popup
async function getTOTPQrCode(secret) {
  const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);
  return qrDataUrl; // send as base64 image to frontend
}

// Step 3 — Verify token entered by user (confirms setup)
function verifyTOTPToken(secretBase32, token) {
  return speakeasy.totp.verify({
    secret:   secretBase32,
    encoding: 'base32',
    token:    token,
    window:   1, // allow 30s clock drift
  });
}

// Step 4 — Generate backup codes (one-time, shown once)
function generateBackupCodes(count = 8) {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(5).toString('hex').toUpperCase() // "A1B2C3D4E5"
  );
}
// Hash and store backup codes; show plain codes once in UI
```

### TOTP Login Verification

```javascript
// At login, after password check:
async function verifyMfaAtLogin(user, mfaToken) {
  if (['employee', 'hr'].includes(user.role)) {
    // Email OTP path
    return await verifyOTP(user._id, mfaToken);
  }

  if (['admin', 'superAdmin'].includes(user.role)) {
    // TOTP path
    const validTOTP = verifyTOTPToken(user.totpSecret, mfaToken);
    if (validTOTP) return true;

    // Fallback: check backup codes
    const hashedInput = await bcrypt.hash(mfaToken, 10);
    const backupMatch = user.backupCodes.find(
      async code => await bcrypt.compare(mfaToken, code.hash) && !code.used
    );
    if (backupMatch) {
      await db.users.updateOne(
        { _id: user._id, 'backupCodes.hash': backupMatch.hash },
        { $set: { 'backupCodes.$.used': true } }
      );
      return true;
    }

    throw new Error('Invalid authenticator code');
  }
}
```

---

## 5. LOGIN FLOW

### Step-by-Step Flow

```
Step 1 — Login Form Input
  User fills:
    ├── System Email    (name.surname.role@netpair.com)
    └── Password

Step 2 — Password Verification
  POST /api/v1/auth/login
    ├── Find user by systemEmail
    ├── Check isActive and isVerified
    └── bcrypt.compare(inputPassword, user.password)

Step 3 — Role Detection from Email
  extractRoleFromEmail('rahul.shah.employee@netpair.com')
  └── returns 'employee'

Step 4 — MFA Challenge
  if role is employee or hr:
    ├── Generate OTP → send to user.personalEmail
    └── Show OTP input field on frontend

  if role is admin or superAdmin:
    └── Show 6-digit TOTP input field on frontend

Step 5 — MFA Verification
  POST /api/v1/auth/verify-mfa
    ├── Verify OTP (employee/hr) or TOTP (admin/superAdmin)
    └── On success → generate JWT + refresh token

Step 6 — Role-Based Redirect
  role === 'employee'   → /dashboard (EmployeeDashboard)
  role === 'hr'         → /dashboard (HRDashboard)
  role === 'admin'      → /dashboard (AdminDashboard)
  role === 'superAdmin' → /dashboard (SuperAdminDashboard)
```

### Login API — Two-Step Structure

```
Step A:  POST /api/v1/auth/login
         Body: { systemEmail, password }
         Returns: { success, mfaRequired: true, mfaMethod: 'otp'|'totp', tempToken }

Step B:  POST /api/v1/auth/verify-mfa
         Body: { tempToken, mfaCode }
         Returns: { success, token, refreshToken, user: { role, systemEmail, profile } }
```

The `tempToken` is a short-lived (5 min) JWT that only grants access to the MFA verification endpoint. The real access token is only issued after MFA passes.

### Login Form Behaviour by Email

```javascript
// Frontend: detect MFA method from email before even hitting the server
function getMfaMethodFromEmail(email) {
  const role = extractRoleFromEmail(email);
  return ['admin', 'superAdmin'].includes(role) ? 'totp' : 'otp';
}

// After password submitted:
// if mfaMethod === 'otp'  → show "We've sent a code to your email"
// if mfaMethod === 'totp' → show "Enter the code from your authenticator app"
```

---

## 6. PROFILE COMPLETION FLOW

### What is NOT in Registration

The following fields are absent from the registration form entirely. Users fill them after first login from their profile page:

```
Profile fields (editable post-login only):
  ├── Profile photo         (image upload, max 2MB, jpg/png)
  ├── Designation           (text, e.g. "Senior Developer")
  ├── Department            (dropdown, from departments list)
  ├── Phone number          (with country code)
  ├── Date of birth         (date picker)
  ├── Gender                (dropdown)
  ├── Address               (street, city, state, pincode)
  ├── Emergency contact     (name + phone)
  ├── Bio / about me        (textarea, 250 chars)
  └── Social links          (LinkedIn, optional)
```

### Profile Completion Prompt

After first login, if `profile.isComplete === false`, show a banner:

```
┌────────────────────────────────────────────────────────┐
│  Complete your profile to get the most out of NetPair  │
│  3 of 8 sections filled                [Complete now]  │
└────────────────────────────────────────────────────────┘
```

### Profile API

```
GET    /api/v1/profile                 Get own profile
PUT    /api/v1/profile                 Update own profile
POST   /api/v1/profile/avatar          Upload profile photo
DELETE /api/v1/profile/avatar          Remove profile photo

GET    /api/v1/profile/:id             Get any user's public profile (auth required)
```

### Profile Update — What Users Can Change

```javascript
// Fields users CAN change themselves
const SELF_EDITABLE = [
  'designation', 'department', 'phone', 'dateOfBirth',
  'gender', 'address', 'emergencyContact', 'bio', 'socialLinks',
  'avatar', 'personalEmail',  // can update OTP email
];

// Fields users CANNOT change themselves (admin only)
const ADMIN_ONLY = [
  'systemEmail',  // never changes
  'role',         // only admin can reassign roles
  'isActive',     // admin enables/disables
  'joiningDate',  // HR sets this
];
```

### Profile Completeness Score

```javascript
function getProfileScore(profile) {
  const fields = [
    'avatar', 'designation', 'department', 'phone',
    'dateOfBirth', 'gender', 'address.city', 'emergencyContact.phone',
  ];
  const filled = fields.filter(f => {
    const keys = f.split('.');
    let val = profile;
    for (const k of keys) val = val?.[k];
    return !!val;
  });
  return { score: filled.length, total: fields.length };
}
```

---

## 7. DATABASE SCHEMA

### User Collection

```javascript
const UserSchema = {
  // --- Identity (set at registration, never changes) ---
  systemEmail:    { type: String, unique: true, required: true },
  // e.g. "rahul.shah.employee@netpair.com"

  personalEmail:  { type: String, required: true },
  // user's real email — for OTP and notifications

  firstName:      { type: String, required: true },
  lastName:       { type: String, required: true },

  role: {
    type:    String,
    enum:    ['employee', 'hr', 'admin', 'superAdmin'],
    required: true,
  },

  password:       { type: String, required: true }, // bcrypt hash

  // --- Verification ---
  isVerified:     { type: Boolean, default: false },
  isActive:       { type: Boolean, default: true },

  // --- MFA ---
  mfaMethod: {
    type: String,
    enum: ['otp', 'totp'],
    // auto-set: employee/hr → 'otp', admin/superAdmin → 'totp'
  },
  totpSecret:     { type: String },         // only for admin/superAdmin (base32)
  totpEnabled:    { type: Boolean, default: false },
  backupCodes: [{
    hash:  String,   // bcrypt hash of backup code
    used:  { type: Boolean, default: false },
  }],

  // --- Profile (filled after login) ---
  profile: {
    avatar:       { type: String },         // URL to uploaded image
    designation:  { type: String },
    department:   { type: String },
    phone:        { type: String },
    dateOfBirth:  { type: Date },
    gender:       { type: String, enum: ['male','female','other','prefer_not'] },
    address: {
      street:     String,
      city:       String,
      state:      String,
      pincode:    String,
      country:    { type: String, default: 'India' },
    },
    emergencyContact: {
      name:         String,
      relationship: String,
      phone:        String,
    },
    bio:          { type: String, maxlength: 250 },
    socialLinks: {
      linkedin:   String,
    },
    isComplete:   { type: Boolean, default: false },
  },

  // --- Employment (set by HR/Admin, not self) ---
  employment: {
    joiningDate:    Date,
    employeeId:     String,   // auto-generated: NP-2026-0001
    employmentType: { type: String, enum: ['fulltime','parttime','contract','intern'] },
    reportingTo:    { type: ObjectId, ref: 'User' },
  },

  // --- Tokens ---
  refreshTokens: [{
    token:     String,
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now },
  }],

  // --- Audit ---
  lastLogin:    Date,
  createdAt:    { type: Date, default: Date.now },
  updatedAt:    { type: Date, default: Date.now },
};
```

### OTP Tokens Collection

```javascript
const OTPTokenSchema = {
  userId:    { type: ObjectId, ref: 'User', required: true },
  otp:       { type: String, required: true },   // bcrypt hashed
  purpose: {
    type: String,
    enum: ['email_verification', 'login_mfa', 'password_reset'],
    required: true,
  },
  expiresAt: { type: Date, required: true },
  used:      { type: Boolean, default: false },
  attempts:  { type: Number, default: 0 },       // max 5 attempts
  createdAt: { type: Date, default: Date.now },
};

// TTL index — MongoDB auto-deletes expired tokens
OTPTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

---

## 8. API ENDPOINTS

### Registration

```
POST   /api/v1/auth/register
Body:  { firstName, lastName, role, personalEmail, password, confirmPassword }

Response 200:
{
  success: true,
  message: "Account created",
  data: {
    systemEmail: "rahul.shah.employee@netpair.com",
    mfaMethod:   "otp",          // or "totp"
    tempUserId:  "...",          // used for MFA setup step
    qrCode:      "data:image/png;base64,..." // only for totp roles
  }
}
```

### MFA Setup (registration)

```
POST   /api/v1/auth/setup-mfa
Body:  { tempUserId, mfaCode }

Response 200:
{
  success: true,
  message: "Account verified",
  data: {
    backupCodes: ["A1B2C3...", ...] // only for totp — shown once
  }
}
```

### Login — Step 1 (password check)

```
POST   /api/v1/auth/login
Body:  { systemEmail, password }

Response 200:
{
  success:    true,
  mfaRequired: true,
  mfaMethod:  "otp" | "totp",
  tempToken:  "...",   // short-lived, 5 min
  message:    "OTP sent to your email" // only for otp
}
```

### Login — Step 2 (MFA verify)

```
POST   /api/v1/auth/verify-mfa
Body:  { tempToken, mfaCode }

Response 200:
{
  success: true,
  data: {
    token:        "JWT...",
    refreshToken: "...",
    user: {
      _id:         "...",
      systemEmail: "rahul.shah.employee@netpair.com",
      firstName:   "Rahul",
      lastName:    "Shah",
      role:        "employee",
      profile: {
        avatar:     null,
        isComplete: false,
      }
    }
  }
}
```

### Profile

```
GET    /api/v1/profile              Own profile (auth required)
PUT    /api/v1/profile              Update own profile (auth required)
  Body: { designation, department, phone, dateOfBirth, gender,
          address, emergencyContact, bio, socialLinks, personalEmail }

POST   /api/v1/profile/avatar       Multipart upload, field name: "avatar"
DELETE /api/v1/profile/avatar       Remove avatar
```

### OTP Resend

```
POST   /api/v1/auth/resend-otp
Body:  { tempToken }
Limit: max 3 resends per session, 60s cooldown between each
```

---

## 9. FRONTEND — REGISTRATION FORM

### Component: `Rform.jsx`

```jsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

const schema = Yup.object({
  firstName:     Yup.string().min(2).max(50).matches(/^[a-zA-Z]+$/, 'Letters only').required(),
  lastName:      Yup.string().min(2).max(50).matches(/^[a-zA-Z]+$/, 'Letters only').required(),
  role:          Yup.string().oneOf(['employee','hr','admin','superAdmin']).required(),
  personalEmail: Yup.string().email().required()
    .test('not-netpair', 'Use your personal email, not a NetPair address',
      val => !val?.endsWith('@netpair.com')),
  password:      Yup.string().min(8)
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/, 'Include upper, lower, number, special char')
    .required(),
  confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required(),
});

const ROLES = [
  { value: 'employee',   label: 'Employee' },
  { value: 'hr',         label: 'HR' },
  { value: 'admin',      label: 'Admin' },
  { value: 'superAdmin', label: 'Super Admin' },
];

export default function Rform() {
  const { register, watch, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const [previewEmail, setPreviewEmail] = useState('');
  const [showPopup, setShowPopup]       = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [tempUserId, setTempUserId]     = useState('');
  const [qrCode, setQrCode]             = useState('');
  const [mfaMethod, setMfaMethod]       = useState('');
  const [mfaCode, setMfaCode]           = useState('');
  const [backupCodes, setBackupCodes]   = useState([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [copied, setCopied]             = useState(false);

  const firstName = watch('firstName');
  const lastName  = watch('lastName');
  const role      = watch('role');

  // Live preview of generated email
  useEffect(() => {
    if (firstName && lastName && role) {
      const clean = s => s.toLowerCase().trim().replace(/[^a-z]/g, '');
      const roleSlug = { employee:'employee', hr:'hr', admin:'admin', superAdmin:'superadmin' }[role];
      if (roleSlug) {
        setPreviewEmail(`${clean(firstName)}.${clean(lastName)}.${roleSlug}@netpair.com`);
      }
    } else {
      setPreviewEmail('');
    }
  }, [firstName, lastName, role]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setGeneratedEmail(json.data.systemEmail);
      setMfaMethod(json.data.mfaMethod);
      setTempUserId(json.data.tempUserId);
      if (json.data.qrCode) setQrCode(json.data.qrCode);
      setShowPopup(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaVerify = async () => {
    try {
      const res = await fetch('/api/v1/auth/setup-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempUserId, mfaCode }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      if (json.data.backupCodes) setBackupCodes(json.data.backupCodes);
      else navigate('/login'); // email OTP verified, go to login
    } catch (err) {
      toast.error(err.message);
    }
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(generatedEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Registration Form (split layout — same as existing Rform pattern) */}
      <form onSubmit={handleSubmit(onSubmit)}>

        {/* Name row */}
        <div style={{ display:'flex', gap:12 }}>
          <div style={{ flex:1 }}>
            <label htmlFor="firstName-field">First name</label>
            <input id="firstName-field" {...register('firstName')} placeholder="Rahul" />
            {errors.firstName && <p className="field-error">{errors.firstName.message}</p>}
          </div>
          <div style={{ flex:1 }}>
            <label htmlFor="lastName-field">Last name</label>
            <input id="lastName-field" {...register('lastName')} placeholder="Shah" />
            {errors.lastName && <p className="field-error">{errors.lastName.message}</p>}
          </div>
        </div>

        {/* Role dropdown */}
        <label htmlFor="role-field">Role</label>
        <select id="role-field" {...register('role')}>
          <option value="">Select role</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        {errors.role && <p className="field-error">{errors.role.message}</p>}

        {/* Live email preview */}
        {previewEmail && (
          <div className="email-preview">
            <span className="preview-label">Your login ID will be</span>
            <code className="preview-email">{previewEmail}</code>
          </div>
        )}

        {/* Personal email for OTP/notifications */}
        <label htmlFor="personalEmail-field">Personal email</label>
        <p className="field-hint">Used for verification and notifications — not your login ID</p>
        <input id="personalEmail-field" type="email" {...register('personalEmail')}
               placeholder="you@gmail.com" />
        {errors.personalEmail && <p className="field-error">{errors.personalEmail.message}</p>}

        {/* Password */}
        <label htmlFor="password-field">Password</label>
        <input id="password-field" type="password" {...register('password')} />
        {errors.password && <p className="field-error">{errors.password.message}</p>}

        {/* Confirm password */}
        <label htmlFor="confirmPassword-field">Confirm password</label>
        <input id="confirmPassword-field" type="password" {...register('confirmPassword')} />
        {errors.confirmPassword && <p className="field-error">{errors.confirmPassword.message}</p>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      {/* Generated Email Popup */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h2>Your NetPair login ID is ready</h2>
            <p>This is your permanent login email. Save it — you cannot change it.</p>

            <div className="email-display">
              <code>{generatedEmail}</code>
              <button onClick={copyEmail}>{copied ? 'Copied!' : 'Copy'}</button>
            </div>

            <hr />

            {/* MFA setup section */}
            {mfaMethod === 'otp' && (
              <>
                <p>A 6-digit code has been sent to your personal email. Enter it below to verify your account.</p>
                <input
                  type="text" maxLength={6} inputMode="numeric"
                  placeholder="000000"
                  value={mfaCode} onChange={e => setMfaCode(e.target.value)}
                />
                <button onClick={handleMfaVerify}>Verify account</button>
              </>
            )}

            {mfaMethod === 'totp' && backupCodes.length === 0 && (
              <>
                <p>Scan this QR code with Google Authenticator or Authy to set up two-factor authentication.</p>
                {qrCode && <img src={qrCode} alt="TOTP QR Code" style={{ width:180 }} />}
                <p>Then enter the 6-digit code from the app:</p>
                <input
                  type="text" maxLength={6} inputMode="numeric"
                  placeholder="000000"
                  value={mfaCode} onChange={e => setMfaCode(e.target.value)}
                />
                <button onClick={handleMfaVerify}>Confirm setup</button>
              </>
            )}

            {/* Backup codes shown once after TOTP confirmed */}
            {mfaMethod === 'totp' && backupCodes.length > 0 && (
              <>
                <p><strong>Save these backup codes.</strong> They will not be shown again. Use one if you lose access to your authenticator app.</p>
                <div className="backup-codes">
                  {backupCodes.map((code, i) => <code key={i}>{code}</code>)}
                </div>
                <button onClick={() => navigate('/login')}>I have saved my backup codes</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

### Email Preview Styling

```css
.email-preview {
  background: var(--tint-blue);
  border: 1px solid #b5d4f4;
  border-radius: 8px;
  padding: 10px 14px;
  margin: 8px 0 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-label {
  font-size: 11px;
  color: #185fa5;
  font-weight: 500;
}

.preview-email {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: #0c447c;
  word-break: break-all;
}

.field-hint {
  font-size: 11px;
  color: #6b7280;
  margin: -8px 0 6px;
}

.popup-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}

.popup-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  max-width: 480px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.email-display {
  background: #f1f5f9;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 16px 0;
}

.email-display code {
  font-size: 14px;
  color: #1a3fb5;
  word-break: break-all;
}

.backup-codes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 12px 0;
}

.backup-codes code {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 2px;
}
```

---

## 10. FRONTEND — LOGIN FORM

### Component: `Lform.jsx`

```jsx
export default function Lform() {
  const [step, setStep]           = useState('credentials'); // 'credentials' | 'mfa'
  const [mfaMethod, setMfaMethod] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [mfaCode, setMfaCode]     = useState('');
  const [otpSent, setOtpSent]     = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1 — credentials
  const onCredentialSubmit = async ({ systemEmail, password }) => {
    setIsLoading(true);
    try {
      const res  = await fetch('/api/v1/auth/login', { method:'POST', ... });
      const json = await res.json();

      setMfaMethod(json.mfaMethod);
      setTempToken(json.tempToken);
      setStep('mfa');
      if (json.mfaMethod === 'otp') setOtpSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 — MFA
  const onMfaSubmit = async () => {
    setIsLoading(true);
    try {
      const res  = await fetch('/api/v1/auth/verify-mfa', { method:'POST',
        body: JSON.stringify({ tempToken, mfaCode }) });
      const json = await res.json();

      localStorage.setItem('authToken',    json.data.token);
      localStorage.setItem('refreshToken', json.data.refreshToken);
      localStorage.setItem('user',         JSON.stringify(json.data.user));

      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {step === 'credentials' && (
        <form onSubmit={handleSubmit(onCredentialSubmit)}>
          <label htmlFor="systemEmail-field">NetPair login email</label>
          <input id="systemEmail-field" type="email"
                 placeholder="name.surname.role@netpair.com"
                 {...register('systemEmail')} />

          <label htmlFor="password-field">Password</label>
          <input id="password-field" type="password" {...register('password')} />

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Checking...' : 'Continue'}
          </button>
        </form>
      )}

      {step === 'mfa' && (
        <div>
          {mfaMethod === 'otp' && (
            <>
              <p>A 6-digit code has been sent to your personal email.</p>
              <p style={{ fontSize:12, color:'#6b7280' }}>
                Check your inbox — valid for 10 minutes.
              </p>
            </>
          )}
          {mfaMethod === 'totp' && (
            <p>Enter the 6-digit code from your authenticator app.</p>
          )}

          <input type="text" maxLength={6} inputMode="numeric"
                 placeholder="000000"
                 value={mfaCode} onChange={e => setMfaCode(e.target.value)}
                 style={{ letterSpacing:'8px', fontSize:22, textAlign:'center' }} />

          {mfaMethod === 'otp' && (
            <button onClick={resendOtp} style={{ fontSize:12 }}>
              Resend code
            </button>
          )}

          <button onClick={onMfaSubmit} disabled={mfaCode.length !== 6 || isLoading}>
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>

          <button onClick={() => setStep('credentials')} style={{ fontSize:12 }}>
            Use a different account
          </button>
        </div>
      )}
    </div>
  );
}
```

### Hint Text on Login Form

Show role hint dynamically as user types their email:

```javascript
function getLoginHint(email) {
  if (!email.includes('@netpair.com')) return null;
  const hints = {
    employee:   'Logging in as Employee',
    hr:         'Logging in as HR',
    admin:      'Logging in as Admin',
    superadmin: 'Logging in as Super Admin',
  };
  const parts = email.split('@')[0].split('.');
  return hints[parts[parts.length - 1]] ?? null;
}

// Render:
{hint && (
  <p style={{ fontSize:12, color:'#1a3fb5', marginTop:4 }}>
    {hint}
  </p>
)}
```

---

## 11. FRONTEND — PROFILE PAGE

### Profile Sections

```jsx
// Profile page is divided into sections, each independently saved

const PROFILE_SECTIONS = [
  {
    id: 'photo',
    title: 'Profile photo',
    fields: ['avatar'],
  },
  {
    id: 'personal',
    title: 'Personal information',
    fields: ['designation', 'department', 'phone', 'dateOfBirth', 'gender'],
  },
  {
    id: 'address',
    title: 'Address',
    fields: ['address.street', 'address.city', 'address.state', 'address.pincode'],
  },
  {
    id: 'emergency',
    title: 'Emergency contact',
    fields: ['emergencyContact.name', 'emergencyContact.relationship', 'emergencyContact.phone'],
  },
  {
    id: 'about',
    title: 'About me',
    fields: ['bio', 'socialLinks.linkedin'],
  },
];
```

### Read-Only Fields on Profile Page

Fields set at registration or by admin are shown as read-only badges:

```jsx
<div className="readonly-field">
  <span className="readonly-label">Login email</span>
  <code className="readonly-value">{user.systemEmail}</code>
  <span className="readonly-note">Cannot be changed</span>
</div>

<div className="readonly-field">
  <span className="readonly-label">Role</span>
  <span className="role-badge">{user.role}</span>
  <span className="readonly-note">Contact admin to change</span>
</div>
```

### Avatar Upload

```javascript
// Max 2MB, jpg/png only
const onAvatarChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) return toast.error('Max file size is 2MB');
  if (!['image/jpeg','image/png'].includes(file.type)) return toast.error('JPG or PNG only');

  const formData = new FormData();
  formData.append('avatar', file);

  const res = await fetch('/api/v1/profile/avatar', {
    method:  'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
    body:    formData,
  });
  const json = await res.json();
  setUser(prev => ({ ...prev, profile: { ...prev.profile, avatar: json.data.url } }));
};
```

---

## 12. SECURITY CONSIDERATIONS

### Email System Security

| Risk | Mitigation |
|---|---|
| User guessing another person's email | Collision suffix prevents exact duplicates; login only works with correct password + MFA |
| Brute-forcing email variants | Rate limit: 10 failed attempts per IP per 15 min, then CAPTCHA |
| User changing role via email edit | `systemEmail` is `immutable: true` in Mongoose schema |
| Enumerating valid system emails | Login always returns "Invalid credentials" — never "Email not found" |

### OTP Security

| Rule | Implementation |
|---|---|
| OTP hashed in DB | `bcrypt.hash(otp, 10)` before storing |
| Max 5 attempts | `attempts` counter on OTPToken; lock after 5 |
| 10 minute expiry | `expiresAt = Date.now() + 600000` |
| Single-use | `used: true` after first valid comparison |
| Resend limit | Max 3 resends; 60s cooldown enforced server-side |
| Auto-TTL cleanup | MongoDB TTL index on `expiresAt` |

### TOTP Security

| Rule | Implementation |
|---|---|
| Secret stored encrypted | AES-256 encrypt `totpSecret` at rest |
| 30s window tolerance | `window: 1` in `speakeasy.totp.verify` |
| Backup codes single-use | `used: true` flag per code |
| Backup codes hashed | bcrypt hash stored, plain shown once only |
| TOTP required even for admins with active sessions | Re-verify on sensitive operations |

### Password Policy

```javascript
const passwordSchema = Yup.string()
  .min(8, 'At least 8 characters')
  .max(128, 'Max 128 characters')
  .matches(/[A-Z]/, 'At least one uppercase letter')
  .matches(/[a-z]/, 'At least one lowercase letter')
  .matches(/[0-9]/, 'At least one number')
  .matches(/[@$!%*?&#^()_+=[\]{};':"\\|,.<>\/?`~-]/, 'At least one special character')
  .required();
```

---

## 13. ENVIRONMENT VARIABLES

```env
# Backend (.env)

# Email (Nodemailer — for OTP delivery)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@netpair.com
EMAIL_PASS=your-app-password
EMAIL_FROM="NetPair IMS <noreply@netpair.com>"

# TOTP
TOTP_ENCRYPTION_KEY=32-char-hex-key-for-aes256  # encrypt totpSecret at rest

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
TEMP_TOKEN_EXPIRES_IN=5m   # MFA challenge token

# File Upload (avatars)
AVATAR_UPLOAD_DIR=uploads/avatars
AVATAR_MAX_SIZE_MB=2
ALLOWED_IMAGE_TYPES=image/jpeg,image/png

# MongoDB
MONGODB_URI=mongodb://localhost:27017/hr_management
```

---

## QUICK REFERENCE

### Email Format
```
{firstname}.{lastname}.{role}@netpair.com
role slugs: employee | hr | admin | superadmin
```

### MFA by Role
```
employee   → Email OTP (10 min, 6 digits)
hr         → Email OTP (10 min, 6 digits)
admin      → Authenticator TOTP (30s window)
superAdmin → Authenticator TOTP (30s window)
```

### Registration — Fields Collected
```
First name, Last name, Role, Personal email, Password, Confirm password
```

### Profile — Fields Collected Post-Login
```
Avatar, Designation, Department, Phone, DOB, Gender,
Address, Emergency contact, Bio, LinkedIn
```

### Login — Two Steps
```
Step 1: systemEmail + password  →  returns tempToken + mfaMethod
Step 2: tempToken + mfaCode     →  returns JWT + user
```

---

*Document covers: registration form, email generation, MFA setup, login flow, profile completion, schema, all API endpoints, and security rules.*  
*Next review: when switching from Pure RBAC to Hybrid (Model 3)*
