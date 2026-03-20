# NetPair RBAC — How It Works
**Stack:** Express + MongoDB + React  
**Pattern:** Role + Permission Hybrid with 4-Guard Pipeline

---

## What is RBAC?

RBAC = Role-Based Access Control.  
Instead of giving each user individual permissions, you assign them a **role**, and the role carries a set of permissions.

```
User → has a Role → Role → has Permissions → Permissions → allow/deny actions
```

In NetPair we extend this with **extra/blocked permissions** per user for fine-grained control.

---

## How REGISTER Works (Step by Step)

```
POST /api/v1/auth/register
Body: { username, email, password }
```

### Step 1 — Validate Input
- `express-validator` checks: username not empty, valid email, password min 6 chars + uppercase + lowercase + number
- If invalid → 400 with error messages

### Step 2 — Check Duplicate Email
```js
const exists = await User.findOne({ email });
if (exists) return 400 "User with this email already exists"
```

### Step 3 — Assign Role (First User = Admin Rule)
```js
const count = await User.countDocuments();
const role  = count === 0 ? "admin" : "employee";
```
- **First user ever registered** → gets `admin` role automatically
- **Everyone after** → gets `employee` role
- Role is NEVER taken from the request body (security rule)

### Step 4 — Create User
```js
const user = await User.create({ username, email, password, role });
```
- Password is hashed by bcrypt in the `pre("save")` hook (cost factor 12)
- Plain text password is NEVER stored

### Step 5 — Generate Tokens
```js
const accessToken  = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "15m" });
const refreshToken = jwt.sign({ id: user._id }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
```
- Access token → 15 minutes
- Refresh token → 7 days

### Step 6 — Store Hashed Refresh Token
```js
user.refreshToken = await bcrypt.hash(refreshToken, 10);
```
- Refresh token is hashed before storing (so even if DB is leaked, tokens are useless)

### Step 7 — Set httpOnly Cookies
```js
res.cookie("token",        accessToken,  { httpOnly: true, ... });
res.cookie("refreshToken", refreshToken, { httpOnly: true, path: "/api/v1/auth" });
```
- Both tokens go into **httpOnly cookies** (JavaScript cannot read them → XSS protection)
- Refresh token cookie is scoped to `/api/v1/auth` path only

### Step 8 — Return Safe User Object
```js
{ id, username, email, role, avatar, isActive }
```
- Password and refreshToken are NEVER returned

---

## How LOGIN Works (Step by Step)

```
POST /api/v1/auth/login
Body: { email, password }
```

### Step 1 — Find User
```js
const user = await User.findOne({ email }).select("+password +refreshToken");
```
- Password field has `select: false` in schema — must explicitly request it

### Step 2 — Verify Password
```js
if (!user || !(await user.comparePassword(password)))
  return 401 "Invalid email or password"
```
- Same error message whether email or password is wrong (prevents user enumeration)
- `comparePassword` uses `bcrypt.compare(candidate, this.password)`

### Step 3 — Check Account Status
```js
if (!user.isActive)
  return 401 "Account is deactivated. Contact your administrator."
```

### Step 4 — Generate + Store New Tokens
Same as register steps 5 and 6 — fresh tokens on every login.

### Step 5 — Set Cookies + Return User
Same as register steps 7 and 8.

---

## The 4-Guard Pipeline (Every Protected Request)

Every API request to a protected route passes through these guards in order:

```
Request
   │
   ▼
┌──────────────────────────────────────┐
│  Guard 1: authenticate               │
│  - Read token from cookie or header  │
│  - Verify JWT signature              │
│  - Find user in DB                   │
│  - Check isActive                    │
│  - Attach req.user                   │
│  Fail → 401                          │
└──────────────────────────────────────┘
   │ ✅
   ▼
┌──────────────────────────────────────┐
│  Guard 2: restrictTo (optional)      │
│  - Quick role check                  │
│  - e.g. restrictTo("admin","hr")     │
│  Fail → 403                          │
└──────────────────────────────────────┘
   │ ✅
   ▼
┌──────────────────────────────────────┐
│  Guard 3: requirePermission          │
│  - Compute final permissions:        │
│    base(role) + extra - blocked      │
│  - Check if required perm exists     │
│  Fail → 403                          │
└──────────────────────────────────────┘
   │ ✅
   ▼
┌──────────────────────────────────────┐
│  Guard 4: requireOwnership           │
│  - admin/hr/superAdmin → skip        │
│  - employee → must own the resource  │
│  Fail → 403                          │
└──────────────────────────────────────┘
   │ ✅
   ▼
Controller runs → returns data
```

---

## Permission Calculation Formula

```
finalPermissions = (ROLE_PERMISSIONS[user.role] + user.extraPermissions)
                   minus user.blockedPermissions
```

### Example
```
user.role = "employee"
ROLE_PERMISSIONS["employee"] = ["attendance:read", "leaves:read", "leaves:create", ...]

user.extraPermissions  = ["reports:read"]   ← admin gave this user bonus access
user.blockedPermissions = ["leaves:create"] ← admin blocked this specific permission

finalPermissions = [
  "attendance:read", "leaves:read",   ← from role (leaves:create removed)
  "reports:read"                      ← bonus from extraPermissions
]
```

---

## Role Hierarchy

```
superAdmin  → wildcard "*" — can do everything
admin       → full HR/management access
hr          → employee + payroll + leave management
employee    → read-only + own data only
```

---

## Token Refresh Flow

When access token expires (after 15 min):

```
Frontend detects 401 response
   │
   ▼
POST /api/v1/auth/refresh  (refresh cookie sent automatically)
   │
   ▼
Backend:
  1. Read refreshToken cookie
  2. Verify JWT signature
  3. Find user in DB
  4. bcrypt.compare(incoming, stored hash)
  5. If valid → issue new access + refresh tokens (rotation)
  6. Store new hashed refresh token in DB
   │
   ▼
Frontend retries original request with new access token
```

---

## Where RBAC Lives in the Codebase

| File | What it does |
|------|-------------|
| `backend/middleware/auth.js` | All 4 guards + ROLE_PERMISSIONS map |
| `backend/models/User.js` | Schema with role, extraPermissions, blockedPermissions |
| `backend/controllers/authController.js` | Register, login, refresh, logout logic |
| `backend/routes/auth.js` | Auth routes with validation rules |
| `src/context/AuthContext.jsx` | Frontend role/permission state |
| `src/services/api.js` | Axios instance with cookie + 401 handling |

---

## 3 Different Approaches to RBAC

### Approach 1 — Pure Role-Based (Simple)
```
User has a role → role allows/denies everything
No per-user customization possible
```
**Pros:** Simple, fast, easy to understand  
**Cons:** Can't give one employee extra access without changing their role  
**Best for:** Small apps with 2-3 roles

```js
// Example
if (user.role === "admin") allowAccess();
else denyAccess();
```

---

### Approach 2 — Pure Permission-Based (Granular)
```
No roles at all
Each user has an explicit list of permissions
Admin manually assigns every permission to every user
```
**Pros:** Maximum flexibility  
**Cons:** Nightmare to manage at scale (100 users × 30 permissions = 3000 assignments)  
**Best for:** Systems where every user is unique

```js
// Example
if (user.permissions.includes("attendance:read")) allowAccess();
```

---

### Approach 3 — Role + Permission Hybrid ✅ (What NetPair Uses)
```
User has a role (base permissions)
Admin can add extraPermissions (bonus)
Admin can add blockedPermissions (revoke specific ones)
```
**Pros:** Best of both worlds — easy defaults + fine-grained control  
**Cons:** Slightly more complex logic  
**Best for:** HR/enterprise apps like NetPair

```js
// Example
const base    = ROLE_PERMISSIONS[user.role];
const final   = [...base, ...user.extraPermissions]
                  .filter(p => !user.blockedPermissions.includes(p));
if (final.includes("attendance:read")) allowAccess();
```

---

### Approach 4 — Attribute-Based Access Control (ABAC)
```
Permissions based on attributes of user, resource, and environment
e.g. "employee can edit attendance only if it's their own AND it's within 24 hours"
```
**Pros:** Most powerful and flexible  
**Cons:** Very complex to implement and debug  
**Best for:** Government/banking systems with complex rules

```js
// Example
if (
  user.role === "employee" &&
  resource.employeeId === user.employeeRef &&
  Date.now() - resource.createdAt < 24 * 60 * 60 * 1000
) allowAccess();
```

---

### Approach 5 — Multi-Tenant RBAC (SaaS)
```
Same as Approach 3 but every permission is scoped to an organizationId
User from Company A can NEVER access Company B's data even with same role
```
**Pros:** Required for SaaS products  
**Cons:** Every DB query must include organizationId filter  
**Best for:** SaaS platforms serving multiple companies  
**Note:** The `RBAC_IMPLEMENTATION.md` file (NestJS version) uses this approach

```js
// Example — every query scoped to org
const data = await Model.find({ organizationId: req.user.organizationId });
```

---

## Comparison Table

| Approach | Complexity | Flexibility | Best For |
|----------|-----------|-------------|----------|
| 1. Pure Role | Low | Low | Simple apps |
| 2. Pure Permission | Medium | High | Unique users |
| 3. Role + Permission Hybrid | Medium | High | **NetPair ✅** |
| 4. ABAC | High | Very High | Banking/Gov |
| 5. Multi-Tenant RBAC | High | High | SaaS products |

---

## Current Status in NetPair

| Feature | Status |
|---------|--------|
| User schema with role + extra/blocked permissions | ✅ Done |
| bcrypt password hashing | ✅ Done |
| JWT access token (15min) | ✅ Done |
| JWT refresh token (7d, hashed in DB) | ✅ Done |
| httpOnly cookie storage | ✅ Done |
| Guard 1: authenticate | ✅ Done |
| Guard 2: restrictTo | ✅ Done |
| Guard 3: requirePermission | ✅ Done |
| Guard 4: requireOwnership | ✅ Done |
| /refresh endpoint | ✅ Done |
| Frontend AuthContext with hasPermission/hasRole | ✅ Done |
| Auto-refresh interceptor in api.js | ✅ Done |
| Apply guards to all routes | ⏳ Pending |

---

*Last updated: Phase 5 — RBAC Implementation*
