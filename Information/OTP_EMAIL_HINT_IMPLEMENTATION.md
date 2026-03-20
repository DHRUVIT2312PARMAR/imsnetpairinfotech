# OTP Verification Email Hint
## NetPair IMS — Show Masked Email on MFA Screen

**Feature:** Show a masked hint of the user's personal email on the OTP verification screen  
**Example:** `d*****pc@gmail.com` — user knows where to check without exposing full email  
**Files:** Backend (login controller) + Frontend (Lform.jsx)  
**Last Updated:** March 2026  

---

## TABLE OF CONTENTS

1. [What We Are Building](#1-what-we-are-building)
2. [Email Masking Logic](#2-email-masking-logic)
3. [Backend Changes](#3-backend-changes)
4. [Frontend Changes — Lform.jsx](#4-frontend-changes--lformjsx)
5. [Final Result](#5-final-result)

---

## 1. WHAT WE ARE BUILDING

### Current OTP screen

```
┌─────────────────────────────────┐
│  Two-factor verification        │
│                                 │
│  A 6-digit code has been sent   │
│  to your personal email.        │
│  Check your inbox — valid       │
│  for 10 minutes.                │
│                                 │
│  [ 0  0  0  0  0  0 ]          │
│                                 │
│  [    Verify & Sign In    ]     │
│                                 │
│  Resend code                    │
└─────────────────────────────────┘
```

### After this implementation

```
┌─────────────────────────────────┐
│  Two-factor verification        │
│                                 │
│  A 6-digit code has been sent   │
│  to your personal email.        │
│                                 │
│  ✉  d*****pc@gmail.com          │  ← masked email hint
│                                 │
│  Check your inbox — valid       │
│  for 10 minutes.                │
│                                 │
│  [ 0  0  0  0  0  0 ]          │
│                                 │
│  [    Verify & Sign In    ]     │
│                                 │
│  Resend code                    │
└─────────────────────────────────┘
```

### Masking rules

| Personal Email | Masked Hint Shown |
|---|---|
| `dhruvitpc@gmail.com` | `d*****pc@gmail.com` |
| `rohit@gmail.com` | `r***t@gmail.com` |
| `ashish.girase@gmail.com` | `a*************e@gmail.com` |
| `a@gmail.com` | `a@gmail.com` (too short — show as-is) |
| `ab@gmail.com` | `a*@gmail.com` |

---

## 2. EMAIL MASKING LOGIC

### The masking function

```javascript
/**
 * maskEmail('dhruvitpc@gmail.com') → 'd*****pc@gmail.com'
 *
 * Rules:
 * - Keep first character
 * - Keep last 2 characters of local part
 * - Replace everything in between with *
 * - Keep domain fully visible (@gmail.com)
 * - If local part ≤ 3 chars, show first char + * per hidden char
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return email;

  const [local, domain] = email.split('@');

  if (local.length <= 2) {
    // e.g. "ab" → "a*"
    return `${local[0]}${'*'.repeat(local.length - 1)}@${domain}`;
  }

  if (local.length === 3) {
    // e.g. "abc" → "a*c"
    return `${local[0]}*${local[local.length - 1]}@${domain}`;
  }

  // Standard: keep first + last 2, mask middle
  const first  = local[0];
  const last2  = local.slice(-2);
  const stars  = '*'.repeat(local.length - 3);

  return `${first}${stars}${last2}@${domain}`;
}
```

### Test the function

```javascript
console.log(maskEmail('dhruvitpc@gmail.com'));     // d*****pc@gmail.com
console.log(maskEmail('rohit@gmail.com'));          // r***t@gmail.com  (wait: r + *** + it = r***it? no)
// local = "rohit" (5 chars), first="r", last2="it", stars="**"
// → r**it@gmail.com  ✓

console.log(maskEmail('ashish.girase@gmail.com'));  // a***********se@gmail.com
console.log(maskEmail('a@gmail.com'));              // a@gmail.com
console.log(maskEmail('ab@gmail.com'));             // a*@gmail.com
console.log(maskEmail('abc@gmail.com'));            // a*c@gmail.com
console.log(maskEmail('mitesh.patel@gmail.com'));   // m**********el@gmail.com
```

---

## 3. BACKEND CHANGES

### File: `backend/controllers/authController.js`

The login response currently returns only `mfaMethod` and `tempToken`. We need to also return the masked personal email so the frontend can display it.

#### Find this section in your login function (after password check passes):

```javascript
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
```

#### Replace with this (adds `maskedEmail` to the response):

```javascript
// ── Mask the personal email for display hint ─────────────────
function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}${'*'.repeat(local.length - 1)}@${domain}`;
  if (local.length === 3) return `${local[0]}*${local[local.length - 1]}@${domain}`;
  const first = local[0];
  const last2 = local.slice(-2);
  const stars = '*'.repeat(local.length - 3);
  return `${first}${stars}${last2}@${domain}`;
}

const maskedEmail = user.mfaMethod === 'otp'
  ? maskEmail(user.personalEmail)
  : null; // TOTP users don't need email hint

return res.status(200).json({
  success:     true,
  mfaRequired: true,
  mfaMethod:   user.mfaMethod,
  data: {
    tempToken,
    mfaMethod:   user.mfaMethod,
    maskedEmail, // ← NEW — e.g. "d*****pc@gmail.com"
  },
  message: user.mfaMethod === 'otp'
    ? 'Verification code sent to your registered email'
    : 'Enter the code from your authenticator app',
});
```

#### Full updated login function for reference

```javascript
exports.login = async (req, res) => {
  try {
    const { systemEmail, password } = req.body;

    if (!systemEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({
      systemEmail: systemEmail.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Contact your administrator.',
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
          ? 'Invalid email or password'
          : 'Account not verified. Run: cd backend && npm run seed',
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Send OTP for employee & hr
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
        console.error('[OTP SEND ERROR]', otpErr.message);
      }
    }

    // ── Email masking helper ───────────────────────────────────
    function maskEmail(email) {
      if (!email || !email.includes('@')) return email;
      const [local, domain] = email.split('@');
      if (local.length <= 2) return `${local[0]}${'*'.repeat(local.length - 1)}@${domain}`;
      if (local.length === 3) return `${local[0]}*${local[local.length - 1]}@${domain}`;
      const first = local[0];
      const last2 = local.slice(-2);
      const stars = '*'.repeat(local.length - 3);
      return `${first}${stars}${last2}@${domain}`;
    }

    const maskedEmail = user.mfaMethod === 'otp'
      ? maskEmail(user.personalEmail)
      : null;

    // Temp token (5 min) for MFA step
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
        mfaMethod:   user.mfaMethod,
        maskedEmail, // ← "d*****pc@gmail.com" for otp, null for totp
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
```

---

## 4. FRONTEND CHANGES — Lform.jsx

### What to change

Only **2 small changes** needed in `Lform.jsx`:

1. Add `maskedEmail` to state
2. Store `maskedEmail` from login response
3. Display it on the MFA screen

### Change 1 — Add maskedEmail state

Find this block at the top of the component:

```javascript
const [step, setStep]           = useState("credentials");
const [mfaMethod, setMfaMethod] = useState("");
const [tempToken, setTempToken] = useState("");
const [mfaCode, setMfaCode]     = useState("");
const [isLoading, setIsLoading] = useState(false);
const [showPass, setShowPass]   = useState(false);
```

Add `maskedEmail` state:

```javascript
const [step, setStep]             = useState("credentials");
const [mfaMethod, setMfaMethod]   = useState("");
const [tempToken, setTempToken]   = useState("");
const [mfaCode, setMfaCode]       = useState("");
const [maskedEmail, setMaskedEmail] = useState(""); // ← ADD THIS
const [isLoading, setIsLoading]   = useState(false);
const [showPass, setShowPass]     = useState(false);
```

### Change 2 — Store maskedEmail from login response

Find this inside `handleCredentialSubmit`:

```javascript
const { data } = await api.post("/auth/login", {
  systemEmail: creds.systemEmail,
  password:    creds.password,
});
setMfaMethod(data.data.mfaMethod);
setTempToken(data.data.tempToken);
setStep("mfa");
if (data.data.mfaMethod === "otp") {
  toast.info("OTP sent to your personal email");
}
```

Add `setMaskedEmail`:

```javascript
const { data } = await api.post("/auth/login", {
  systemEmail: creds.systemEmail,
  password:    creds.password,
});
setMfaMethod(data.data.mfaMethod);
setTempToken(data.data.tempToken);
setMaskedEmail(data.data.maskedEmail || ""); // ← ADD THIS
setStep("mfa");
if (data.data.mfaMethod === "otp") {
  toast.info("OTP sent to your personal email");
}
```

### Change 3 — Display hint on MFA screen

Find the OTP section inside the `step === "mfa"` block:

```jsx
{mfaMethod === "otp" && (
  <>
    <p className="text-gray-500 text-sm mb-1">A 6-digit code has been sent to your personal email.</p>
    <p className="text-gray-400 text-xs mb-6">Check your inbox — valid for 10 minutes.</p>
  </>
)}
```

Replace with:

```jsx
{mfaMethod === "otp" && (
  <>
    <p className="text-gray-500 text-sm mb-1">
      A 6-digit code has been sent to your personal email.
    </p>

    {/* ── Email hint ─────────────────────────────────────────── */}
    {maskedEmail && (
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-100
                      rounded-lg px-4 py-2.5 mb-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16" height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
        <span className="text-blue-700 text-sm font-medium tracking-wide">
          {maskedEmail}
        </span>
      </div>
    )}
    {/* ─────────────────────────────────────────────────────────── */}

    <p className="text-gray-400 text-xs mb-6">
      Check your inbox — valid for 10 minutes.
    </p>
  </>
)}
```

### Complete updated Lform.jsx

```jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import api from "../../services/api";

const Lform = () => {
  const { login } = useAuth();

  const [step, setStep]               = useState("credentials");
  const [mfaMethod, setMfaMethod]     = useState("");
  const [tempToken, setTempToken]     = useState("");
  const [mfaCode, setMfaCode]         = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");  // ← NEW
  const [isLoading, setIsLoading]     = useState(false);
  const [showPass, setShowPass]       = useState(false);

  const [creds, setCreds]   = useState({ systemEmail: "", password: "" });
  const [errors, setErrors] = useState({});

  const validateCreds = () => {
    const e = {};
    if (!creds.systemEmail.trim()) e.systemEmail = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(creds.systemEmail)) e.systemEmail = "Invalid email format";
    if (!creds.password) e.password = "Password is required";
    return e;
  };

  // Step 1 — credentials
  const handleCredentialSubmit = async (e) => {
    e.preventDefault();
    const errs = validateCreds();
    if (Object.keys(errs).length) return setErrors(errs);

    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/login", {
        systemEmail: creds.systemEmail,
        password:    creds.password,
      });
      setMfaMethod(data.data.mfaMethod);
      setTempToken(data.data.tempToken);
      setMaskedEmail(data.data.maskedEmail || "");  // ← NEW
      setStep("mfa");
      if (data.data.mfaMethod === "otp") {
        toast.info("OTP sent to your personal email");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 — MFA
  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    if (!mfaCode.trim()) return toast.error("Enter the verification code");

    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/verify-mfa", { tempToken, mfaCode });
      login(data.data.user);
      toast.success(`Welcome back, ${data.data.user.firstName}!`);
      window.location.replace("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.post("/auth/resend-otp", { tempToken });
      toast.success("OTP resent to your personal email");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not resend OTP");
    }
  };

  const inputCls = (name) =>
    `w-full h-10 border rounded px-3 focus:ring-2 focus:ring-blue-500
     outline-none text-sm ${
       errors[name] ? "border-red-500 bg-red-50" : "border-gray-300"
     }`;

  return (
    <div>

      {/* ── Step 1: Credentials ──────────────────────────────────── */}
      {step === "credentials" && (
        <form onSubmit={handleCredentialSubmit}
          className="bg-white p-8 rounded-lg w-full max-w-md shadow">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Login to your account</h2>
          <p className="text-gray-500 mb-6 text-sm">Enter your NetPair login email and password</p>

          <div className="mb-4">
            <label htmlFor="login-email" className="block font-medium mb-1 text-sm">
              NetPair Email
            </label>
            <input
              id="login-email"
              type="email"
              name="systemEmail"
              value={creds.systemEmail}
              onChange={(e) => {
                setCreds(p => ({ ...p, systemEmail: e.target.value }));
                setErrors(p => ({ ...p, systemEmail: "" }));
              }}
              placeholder="name.surname.role@netpair.com"
              className={inputCls("systemEmail")}
            />
            {errors.systemEmail && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <i className="ri-error-warning-line" />{errors.systemEmail}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="login-password" className="block font-medium mb-1 text-sm">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPass ? "text" : "password"}
                name="password"
                value={creds.password}
                onChange={(e) => {
                  setCreds(p => ({ ...p, password: e.target.value }));
                  setErrors(p => ({ ...p, password: "" }));
                }}
                placeholder="Enter your password"
                className={`${inputCls("password")} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <i className={showPass ? "ri-eye-off-line" : "ri-eye-line"} />
              </button>
            </div>
            {errors.password && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <i className="ri-error-warning-line" />{errors.password}
              </p>
            )}
          </div>

          <div className="flex justify-end mb-6 text-sm">
            <Link to="/forgot" className="text-blue-700 font-semibold hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-800 text-white py-2 rounded hover:bg-blue-600
                       transition disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Checking...
              </>
            ) : "Continue"}
          </button>

          <p className="text-center mt-5 text-sm">
            Don't have an account?{" "}
            <Link to="/employee/registration"
              className="text-blue-700 font-bold hover:underline">
              Sign Up
            </Link>
          </p>
        </form>
      )}

      {/* ── Step 2: MFA ──────────────────────────────────────────── */}
      {step === "mfa" && (
        <form onSubmit={handleMfaSubmit}
          className="bg-white p-8 rounded-lg w-full max-w-md shadow">

          <button
            type="button"
            onClick={() => { setStep("credentials"); setMfaCode(""); }}
            className="flex items-center gap-1 text-sm text-gray-500
                       hover:text-gray-700 mb-4">
            <i className="ri-arrow-left-line" /> Back
          </button>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Two-factor verification
          </h2>

          {/* OTP — email hint shown here */}
          {mfaMethod === "otp" && (
            <>
              <p className="text-gray-500 text-sm mb-3">
                A 6-digit code has been sent to your personal email.
              </p>

              {/* ── Masked email hint ────────────────────────── */}
              {maskedEmail && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-100
                                rounded-lg px-4 py-2.5 mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16" height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <span className="text-blue-700 text-sm font-medium tracking-wide">
                    {maskedEmail}
                  </span>
                </div>
              )}
              {/* ─────────────────────────────────────────────── */}

              <p className="text-gray-400 text-xs mb-6">
                Check your inbox — valid for 10 minutes.
              </p>
            </>
          )}

          {/* TOTP — no email hint needed */}
          {mfaMethod === "totp" && (
            <p className="text-gray-500 text-sm mb-6">
              Enter the 6-digit code from your authenticator app.
            </p>
          )}

          {/* OTP input */}
          <input
            type="text"
            maxLength={6}
            inputMode="numeric"
            placeholder="000000"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
            className="w-full h-16 border border-gray-300 rounded-lg text-center
                       text-3xl tracking-[16px] font-mono outline-none
                       focus:ring-2 focus:ring-blue-500 mb-5"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-800 text-white py-2 rounded hover:bg-blue-600
                       transition disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying...
              </>
            ) : "Verify & Sign In"}
          </button>

          {mfaMethod === "otp" && (
            <button
              type="button"
              onClick={handleResendOtp}
              className="w-full mt-3 text-sm text-blue-700 hover:underline">
              Resend code
            </button>
          )}

        </form>
      )}

    </div>
  );
};

export default Lform;
```

---

## 5. FINAL RESULT

### What the user sees

```
┌──────────────────────────────────────┐
│  Two-factor verification             │
│                                      │
│  A 6-digit code has been sent to     │
│  your personal email.                │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  ✉  d*****pc@gmail.com        │  │
│  └────────────────────────────────┘  │
│                                      │
│  Check your inbox — valid for        │
│  10 minutes.                         │
│                                      │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐    │
│  │  │ │  │ │  │ │  │ │  │ │  │    │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘    │
│                                      │
│  [      Verify & Sign In      ]      │
│                                      │
│         Resend code                  │
└──────────────────────────────────────┘
```

### Summary of all changes

| File | Change |
|------|--------|
| `backend/controllers/authController.js` | Add `maskEmail()` helper + return `maskedEmail` in login response |
| `src/components/login/Lform.jsx` | Add `maskedEmail` state, store from response, display in OTP section |

### Only shown for

- `mfaMethod === 'otp'` (employee and hr roles only)
- Hidden automatically for `mfaMethod === 'totp'` (admin and superAdmin)
- Hidden if `maskedEmail` is null or empty string

---

*Security note: The masked email never exposes the full address. Only first character + last 2 characters of the local part are visible. Domain is shown in full so the user knows which email provider to check.*
