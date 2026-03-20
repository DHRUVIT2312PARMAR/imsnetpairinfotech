# Institute SaaS — RBAC Implementation Guide
**Version:** 1.0  
**Stack:** NestJS (Backend) + Flutter (Frontend) + MongoDB (Database)  
**Pattern:** Role + Permission Hybrid with 4-Dimensional Guard Pipeline

---

## Table of Contents
1. [Roles and Permission Matrix](#1-roles-and-permission-matrix)
2. [JWT Token Structure](#2-jwt-token-structure)
3. [MongoDB User Schema](#3-mongodb-user-schema)
4. [Guard 1 — JwtAuthGuard](#4-guard-1--jwtauthguard)
5. [Guard 2 — TenantGuard](#5-guard-2--tenantguard)
6. [Guard 3 — RbacGuard](#6-guard-3--rbacguard)
7. [Guard 4 — ResourceOwnershipGuard](#7-guard-4--resourceownershipguard)
8. [Applying All Guards to Controllers](#8-applying-all-guards-to-controllers)
9. [Registration — First User Logic](#9-registration--first-user-logic)
10. [Login — Token Flow](#10-login--token-flow)
11. [Flutter — Client Side RBAC](#11-flutter--client-side-rbac)
12. [Rate Limiting Setup](#12-rate-limiting-setup)
13. [Testing RBAC](#13-testing-rbac)
14. [Environment Variables Needed](#14-environment-variables-needed)

---

## 1. Roles and Permission Matrix

### Roles
```
admin       → Full access within their organization
staff       → Create + read students, payments, enrollments
instructor  → Attendance + read own course data only
student     → Read own data only
parent      → Read linked child data only
```

### Permission Matrix

| Resource | admin | staff | instructor | student | parent |
|----------|-------|-------|------------|---------|--------|
| students:create | ✅ | ✅ | ❌ | ❌ | ❌ |
| students:read | ✅ ALL | ✅ ALL | ✅ OWN COURSES | ✅ SELF | ✅ CHILD |
| students:update | ✅ | ✅ | ❌ | ✅ SELF ONLY | ❌ |
| students:delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| courses:create | ✅ | ❌ | ❌ | ❌ | ❌ |
| courses:read | ✅ | ✅ | ✅ OWN | ✅ | ✅ |
| courses:update | ✅ | ❌ | ✅ OWN | ❌ | ❌ |
| courses:delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| enrollments:create | ✅ | ✅ | ❌ | ❌ | ❌ |
| enrollments:read | ✅ | ✅ | ✅ OWN COURSES | ✅ SELF | ✅ CHILD |
| enrollments:update | ✅ | ✅ | ❌ | ❌ | ❌ |
| enrollments:delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| attendance:create | ✅ | ❌ | ✅ OWN COURSES | ❌ | ❌ |
| attendance:read | ✅ | ✅ | ✅ OWN COURSES | ✅ SELF | ✅ CHILD |
| attendance:update | ✅ | ❌ | ✅ OWN COURSES | ❌ | ❌ |
| attendance:delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| payments:create | ✅ | ✅ | ❌ | ❌ | ✅ OWN CHILD |
| payments:read | ✅ | ✅ | ❌ | ✅ SELF | ✅ CHILD |
| payments:update | ✅ | ✅ | ❌ | ❌ | ❌ |
| payments:delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| staff:create | ✅ | ❌ | ❌ | ❌ | ❌ |
| staff:read | ✅ | ✅ | ❌ | ❌ | ❌ |
| staff:update | ✅ | ❌ | ❌ | ❌ | ❌ |
| staff:delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| settings:read | ✅ | ❌ | ❌ | ❌ | ❌ |
| settings:update | ✅ | ❌ | ❌ | ❌ | ❌ |
| reports:read | ✅ ALL | ✅ ALL | ✅ OWN | ✅ SELF | ✅ CHILD |
| analytics:read | ✅ ALL | ✅ ALL | ✅ OWN | ❌ | ❌ |

### Role Permissions Map (for code reference)
```
ROLE_PERMISSIONS = {
  admin: [
    "students:create", "students:read", "students:update", "students:delete",
    "courses:create", "courses:read", "courses:update", "courses:delete",
    "enrollments:create", "enrollments:read", "enrollments:update", "enrollments:delete",
    "attendance:create", "attendance:read", "attendance:update", "attendance:delete",
    "payments:create", "payments:read", "payments:update", "payments:delete",
    "staff:create", "staff:read", "staff:update", "staff:delete",
    "settings:read", "settings:update",
    "reports:read", "analytics:read"
  ],
  staff: [
    "students:create", "students:read", "students:update",
    "courses:read",
    "enrollments:create", "enrollments:read", "enrollments:update",
    "attendance:read",
    "payments:create", "payments:read", "payments:update",
    "staff:read",
    "reports:read", "analytics:read"
  ],
  instructor: [
    "courses:read", "courses:update",
    "students:read",
    "enrollments:read",
    "attendance:create", "attendance:read", "attendance:update",
    "reports:read"
  ],
  student: [
    "students:read",
    "courses:read",
    "enrollments:read",
    "attendance:read",
    "payments:read"
  ],
  parent: [
    "students:read",
    "courses:read",
    "enrollments:read",
    "attendance:read",
    "payments:create", "payments:read"
  ]
}
```

---

## 2. JWT Token Structure

### What Goes Inside the Token
```
JWT Payload = {
  sub:            "user_mongodb_id",
  email:          "user@institute.com",
  role:           "admin",
  organizationId: "org_mongodb_id"
}
```

### What Does NOT Go in the Token
```
❌ password
❌ permissions array (permissions are in code, not token)
❌ extraPermissions
❌ any sensitive personal data
```

### Token Expiry
```
accessToken  → expires in 15 minutes
refreshToken → expires in 7 days (stored HASHED in MongoDB)
```

---

## 3. MongoDB User Schema

### File: src/schemas/user.schema.ts

```
User Collection Fields:
  _id              → ObjectId (MongoDB auto)
  organizationId   → String, required, indexed          ← TENANT KEY
  name             → String, required
  email            → String, required
  password         → String, required, select:false      ← NEVER returned
  role             → Enum: admin|staff|instructor|student|parent
  isActive         → Boolean, default: true
  extraPermissions → [String], default: []               ← BONUS permissions
  blockedPermissions → [String], default: []             ← REVOKED permissions
  refreshToken     → String, select:false, hashed        ← NEVER returned
  twoFactorEnabled → Boolean, default: false
  twoFactorSecret  → String, select:false
  profileImageUrl  → String
  phoneNumber      → String
  department       → String
  salary           → Number, select:false                ← NEVER returned by default
  createdAt        → DateTime (auto via timestamps)
  updatedAt        → DateTime (auto via timestamps)

Indexes:
  { organizationId: 1, email: 1 }  → unique compound index
  { organizationId: 1, role: 1 }   → for role filtering
```

---

## 4. Guard 1 — JwtAuthGuard

### File: src/common/guards/jwt-auth.guard.ts

**Purpose:** Verify the JWT token. Attach the user to the request.

**Runs on:** Every protected endpoint.

**Logic Flow:**
```
1. Read token from Authorization: Bearer <token> header
2. If no token → throw 401 "Authentication required"
3. Verify token signature with JWT_SECRET
4. If invalid or expired → throw 401 "Token invalid or expired"
5. Extract user._id from token payload (sub field)
6. Find user in MongoDB by _id
7. If user not found → throw 401 "User no longer exists"
8. If user.isActive === false → throw 401 "Account is deactivated"
9. Attach full user object to req.user
10. Call next()
```

**What req.user contains after this guard:**
```
req.user = {
  _id,
  email,
  role,
  organizationId,
  isActive,
  extraPermissions,
  blockedPermissions
}
```

### File: src/auth/strategies/jwt.strategy.ts

**Logic Flow:**
```
1. Extract JWT from Bearer header
2. Call validate(payload)
3. In validate: find user by payload.sub
4. Return user → Passport attaches to req.user
```

---

## 5. Guard 2 — TenantGuard

### File: src/common/guards/tenant.guard.ts

**Purpose:** Ensure every request is scoped to the user's own organization. Block all cross-organization access before role is even checked.

**Runs on:** Every protected endpoint, after JwtAuthGuard.

**Logic Flow:**
```
1. Read req.user (set by JwtAuthGuard)
2. If req.user has no organizationId → throw 403 "No organization context"
3. Inject req.organizationId = req.user.organizationId
4. Call next()
```

**Critical Rule:**
```
ALWAYS use req.organizationId in service queries.
NEVER use req.body.organizationId or req.query.organizationId.
The organizationId from the token is the ONLY trusted source.
```

**Every service query must look like this:**
```
findAll(organizationId: string) {
  return this.model.find({ organizationId })  ← always scoped
}

findOne(id: string, organizationId: string) {
  return this.model.findOne({ _id: id, organizationId })  ← scoped + id
}
```

---

## 6. Guard 3 — RbacGuard

### File: src/common/guards/rbac.guard.ts

**Purpose:** Check if the user's role has permission to perform the requested action on the requested resource.

**Runs on:** Endpoints decorated with @Permission() or @Roles(), after TenantGuard.

**Logic Flow:**
```
1. Read required permission from route metadata (@Permission decorator)
2. Read req.user.role, req.user.extraPermissions, req.user.blockedPermissions
3. Get base permissions for role from ROLE_PERMISSIONS map
4. Add extraPermissions to base permissions
5. Remove blockedPermissions from result
6. Check if required permission exists in final list
7. If yes → call next()
8. If no → throw 403 "Insufficient permissions"
```

**Permission Calculation:**
```
finalPermissions = (ROLE_PERMISSIONS[user.role] + user.extraPermissions)
                   minus user.blockedPermissions

if required permission is in finalPermissions → ALLOW
else → DENY (403)
```

### File: src/common/decorators/permission.decorator.ts

**Usage on routes:**
```
@Permission("students:create")   → only roles that have students:create can call this
@Permission("attendance:write")  → only roles that have attendance:write can call this
@Roles("admin", "staff")         → shorthand for role-level restriction
```

---

## 7. Guard 4 — ResourceOwnershipGuard

### File: src/common/guards/ownership.guard.ts

**Purpose:** Even if the role allows the action, verify that this specific user's relationship to this specific resource instance allows it.

**Runs on:** Endpoints that have ownership-scoped access (instructor→own courses, student→self, parent→child).

**When it applies:**
```
instructor reading students  → only students enrolled in instructor's courses
instructor writing attendance → only for their assigned courses
student reading own data     → only their own student/payment/attendance records
parent reading child data    → only for their linked child
```

**Logic Flow:**
```
1. Read req.user.role
2. If role is admin or staff → skip this guard (they have org-wide access)
3. If role is instructor:
   a. Get the courseId or studentId from params
   b. Check if instructor is assigned to that course
   c. If not assigned → throw 403 "Not your resource"
4. If role is student:
   a. Get the resource owner from DB
   b. Check if resource.studentId === req.user._id
   c. If not → throw 403 "Not your resource"
5. If role is parent:
   a. Get parent's linked children from DB
   b. Check if resource belongs to one of their children
   c. If not → throw 403 "Not your resource"
6. If check passes → call next()
```

**Parent-Child Relationship stored in User document:**
```
parent User document has:
  linkedStudentIds: ["student_id_1", "student_id_2"]

Every ownership check for parent:
  if (linkedStudentIds.includes(resource.studentId)) → ALLOW
  else → DENY
```

---

## 8. Applying All Guards to Controllers

### Guard Application Order
```
JwtAuthGuard → TenantGuard → RbacGuard → ResourceOwnershipGuard
```

### All 4 Guards Together (Global Setup)
Apply JwtAuthGuard and TenantGuard globally in AppModule so they run on every protected route automatically.

Apply RbacGuard and ResourceOwnershipGuard per-controller or per-route using decorators.

### Students Controller — Example Application

```
GET    /students              → JwtAuth + Tenant + @Permission("students:read")
GET    /students/:id          → JwtAuth + Tenant + @Permission("students:read") + Ownership
POST   /students              → JwtAuth + Tenant + @Permission("students:create")
PUT    /students/:id          → JwtAuth + Tenant + @Permission("students:update") + Ownership
DELETE /students/:id          → JwtAuth + Tenant + @Permission("students:delete")
```

### Courses Controller
```
GET    /courses               → JwtAuth + Tenant + @Permission("courses:read")
GET    /courses/:id           → JwtAuth + Tenant + @Permission("courses:read") + Ownership
POST   /courses               → JwtAuth + Tenant + @Permission("courses:create")
PUT    /courses/:id           → JwtAuth + Tenant + @Permission("courses:update") + Ownership
DELETE /courses/:id           → JwtAuth + Tenant + @Permission("courses:delete")
```

### Attendance Controller
```
GET    /attendance            → JwtAuth + Tenant + @Permission("attendance:read") + Ownership
POST   /attendance            → JwtAuth + Tenant + @Permission("attendance:create") + Ownership
PUT    /attendance/:id        → JwtAuth + Tenant + @Permission("attendance:update") + Ownership
DELETE /attendance/:id        → JwtAuth + Tenant + @Permission("attendance:delete")
```

### Payments Controller
```
GET    /payments              → JwtAuth + Tenant + @Permission("payments:read") + Ownership
POST   /payments              → JwtAuth + Tenant + @Permission("payments:create") + Ownership
PUT    /payments/:id          → JwtAuth + Tenant + @Permission("payments:update")
DELETE /payments/:id          → JwtAuth + Tenant + @Permission("payments:delete")
```

### Settings Controller
```
GET    /settings              → JwtAuth + Tenant + @Roles("admin")
PUT    /settings              → JwtAuth + Tenant + @Roles("admin")
```

### Staff Controller
```
GET    /staff                 → JwtAuth + Tenant + @Permission("staff:read")
POST   /staff                 → JwtAuth + Tenant + @Permission("staff:create")
PUT    /staff/:id             → JwtAuth + Tenant + @Permission("staff:update")
DELETE /staff/:id             → JwtAuth + Tenant + @Permission("staff:delete")
```

### Analytics Controller
```
GET    /analytics/dashboard   → JwtAuth + Tenant + @Permission("analytics:read") + Ownership
GET    /analytics/revenue     → JwtAuth + Tenant + @Roles("admin","staff")
GET    /analytics/attendance  → JwtAuth + Tenant + @Permission("reports:read") + Ownership
```

---

## 9. Registration — First User Logic

### Institute SaaS vs NetPair Rule

NetPair makes the first registered user globally an admin. Institute SaaS works differently because of multi-tenancy.

```
Every new registration = New organization + First admin user simultaneously.

Rule:
  Registering creates BOTH an Organization record AND an Admin user.
  That user is always admin because they are creating the organization.
  All subsequent users are invited/created BY the admin through the staff management screen.
  New users do NOT self-register and pick a role.
```

### Registration Flow
```
POST /auth/register

Inputs:
  organizationName   → name of the institute
  organizationEmail  → contact email for the institute
  adminName          → first admin's full name
  adminEmail         → first admin's login email
  adminPassword      → first admin's password

Steps:
  1. Validate all inputs (format, strength)
  2. Check organizationEmail not already registered → 409 if exists
  3. Create Organization document in MongoDB
  4. Hash adminPassword with bcrypt (cost factor 12)
  5. Create User document with:
       organizationId = new org._id
       role = "admin"   ← ALWAYS admin, hardcoded, not from input
       email = adminEmail
  6. Generate accessToken (15min) and refreshToken (7d)
  7. Hash refreshToken → store hash in user.refreshToken
  8. Send welcome email via SendGrid
  9. Return { accessToken, refreshToken, user: { id, name, email, role, organizationId } }
```

### Adding More Users (Admin Creates Staff/Instructors)
```
POST /staff  (requires admin JWT)

Admin provides:
  name, email, role, department

Steps:
  1. JwtAuth + Tenant + @Permission("staff:create") guards run
  2. organizationId taken from req.organizationId (NOT from body)
  3. Create user with organizationId = req.organizationId
  4. Send invite email with temporary password
  5. User logs in, forced to change password on first login
```

---

## 10. Login — Token Flow

### Login Flow
```
POST /auth/login

Inputs:
  email          → user's email
  organizationId → which organization they belong to
  password       → plain text (never stored)

Steps:
  1. Find user by { email, organizationId } in MongoDB
  2. If not found → 401 "Invalid credentials" (same message as wrong password)
  3. Compare input password with stored bcrypt hash
  4. If no match → 401 "Invalid credentials"
  5. If user.isActive === false → 401 "Account deactivated"
  6. If user.twoFactorEnabled === true:
       → return { requiresTwoFactor: true, tempToken } (10min temp token)
       → frontend shows OTP input screen
       → user submits OTP → POST /auth/verify-2fa
       → if OTP correct → continue to step 7
  7. Generate accessToken and refreshToken
  8. Hash refreshToken → store in user.refreshToken field
  9. Return {
       accessToken,
       refreshToken,
       expiresIn: 900,
       user: { id, name, email, role, organizationId, profileImageUrl }
     }
```

### Token Refresh Flow
```
POST /auth/refresh

Inputs:
  userId       → user's MongoDB _id
  refreshToken → plain refresh token from client storage

Steps:
  1. Find user by userId
  2. If no user or no refreshToken stored → 401
  3. Compare input refreshToken with stored bcrypt hash
  4. If no match → 401 "Invalid refresh token"
  5. Generate new accessToken and refreshToken
  6. Hash new refreshToken → update in DB (old one invalidated)
  7. Return { accessToken, refreshToken }
```

### Logout Flow
```
POST /auth/logout  (requires valid JWT)

Steps:
  1. JwtAuthGuard runs → verifies token
  2. Set user.refreshToken = null in MongoDB
  3. Return 204 No Content
  4. Flutter client deletes both tokens from secure storage
```

---

## 11. Flutter — Client Side RBAC

### Important Rule
```
Flutter RBAC = UI convenience only.
NestJS RBAC = Actual security enforcement.

Never rely on Flutter RBAC for security.
It can be bypassed by anyone who intercepts network requests.
The backend guards are the real protection.
```

### What to Store After Login
```
flutter_secure_storage stores:
  access_token    → JWT access token
  refresh_token   → JWT refresh token
  organization_id → user's organizationId

In-memory (Provider/Riverpod state):
  user object = { id, name, email, role, organizationId, profileImageUrl }
```

### AuthProvider — Role-Based State
```
AuthState contains:
  User? currentUser
  bool isAuthenticated
  bool isLoading
  String? error

Helper getters on AuthState or AuthNotifier:
  bool get isAdmin       → currentUser?.role == "admin"
  bool get isStaff       → currentUser?.role == "staff"
  bool get isInstructor  → currentUser?.role == "instructor"
  bool get isStudent     → currentUser?.role == "student"
  bool get isParent      → currentUser?.role == "parent"

  bool get canManageStaff    → isAdmin
  bool get canCreateStudents → isAdmin || isStaff
  bool get canMarkAttendance → isAdmin || isInstructor
  bool get canRecordPayments → isAdmin || isStaff
  bool get canViewAnalytics  → isAdmin || isStaff
  bool get canViewSettings   → isAdmin
```

### Role-Based Navigation — go_router
```
router.dart redirect logic:

On every route change:
  1. If not authenticated → redirect to /login
  2. If authenticated, check route's allowed roles
  3. If user.role not in allowedRoles → redirect to /unauthorized

Route definitions with role restrictions:
  /dashboard     → all authenticated roles
  /students      → admin, staff, instructor
  /courses       → all authenticated roles
  /attendance    → admin, staff, instructor
  /payments      → admin, staff, parent
  /reports       → admin, staff, instructor
  /analytics     → admin, staff
  /settings      → admin only
  /staff         → admin only
  /unauthorized  → show "You don't have permission" screen
```

### Hiding UI Elements by Role
```
Pattern for showing/hiding buttons and sections:

In any Widget:
  final user = ref.watch(currentUserProvider);

  if (user.role == "admin" || user.role == "staff")
    show AddStudentButton

  if (user.role == "instructor")
    show MarkAttendanceButton

  if (user.role == "student" || user.role == "parent")
    hide all management buttons, show read-only views only
```

### Role-Specific Dashboard Screens
```
HomeScreen logic:
  switch (user.role) {
    "admin"      → show AdminDashboard (full analytics, all stats)
    "staff"      → show StaffDashboard (students, payments, enrollments)
    "instructor" → show InstructorDashboard (my courses, today's attendance)
    "student"    → show StudentDashboard (my courses, attendance %, fees due)
    "parent"     → show ParentDashboard (child's progress, payments)
  }
```

---

## 12. Rate Limiting Setup

### File: src/app.module.ts — ThrottlerModule

```
Rate Limit Rules:

Auth endpoints (/auth/login, /auth/register, /auth/forgot-password):
  max: 5 requests
  window: 60 seconds
  per: IP address

OTP endpoints (/auth/send-otp, /auth/verify-otp):
  max: 3 requests
  window: 900 seconds (15 minutes)
  per: user ID

All other API endpoints:
  max: 200 requests
  window: 60 seconds
  per: organization ID
```

### Apply Rate Limiting on Auth Controller
```
@Throttle({ default: { limit: 5, ttl: 60000 } })
on: POST /auth/login

@Throttle({ default: { limit: 3, ttl: 60000 } })
on: POST /auth/register

@Throttle({ default: { limit: 3, ttl: 60000 } })
on: POST /auth/forgot-password

@Throttle({ default: { limit: 3, ttl: 900000 } })
on: POST /auth/send-otp
```

---

## 13. Testing RBAC

### Critical Tests — Must Pass Before Any Release

#### Multi-Tenant Isolation Tests
```
Test MT-01:
  Login as admin of Organization A.
  GET /students with Organization A's JWT.
  Add query param organizationId=org_b_id.
  Expected: Only Organization A students returned. Never Organization B.

Test MT-02:
  Login as admin of Organization A.
  GET /students/:student_id_from_org_b
  Expected: 404 Not Found. Never 200.

Test MT-03:
  Login as admin of Organization A.
  DELETE /students/:student_id_from_org_b
  Expected: 404 Not Found. Student from Org B NOT deleted.
```

#### Role Permission Tests
```
Test RP-01:
  Login as instructor.
  DELETE /students/:any_student_id (instructor lacks students:delete)
  Expected: 403 Forbidden.

Test RP-02:
  Login as student.
  GET /students (student cannot list all students)
  Expected: 403 Forbidden or only self returned.

Test RP-03:
  Login as staff.
  PUT /settings (staff lacks settings:update)
  Expected: 403 Forbidden.

Test RP-04:
  Login as parent.
  POST /attendance (parent lacks attendance:create)
  Expected: 403 Forbidden.

Test RP-05:
  Login as instructor.
  GET /payments (instructor lacks payments:read)
  Expected: 403 Forbidden.
```

#### Resource Ownership Tests
```
Test RO-01:
  Login as instructor assigned to Course A only.
  POST /attendance with courseId = Course B (not their course)
  Expected: 403 Forbidden.

Test RO-02:
  Login as student with ID "student_123".
  GET /payments?studentId=student_456 (different student)
  Expected: 403 Forbidden or empty result. Never student_456's payments.

Test RO-03:
  Login as parent linked to child "student_123" only.
  GET /students/:student_456_id (unlinked student)
  Expected: 403 Forbidden.
```

#### Authentication Tests
```
Test AU-01:
  Send request with no Authorization header.
  Expected: 401 Unauthorized.

Test AU-02:
  Send request with expired access token.
  Expected: 401 Unauthorized.

Test AU-03:
  Send request with manually modified JWT payload (tampered role).
  Expected: 401 Unauthorized (signature invalid).

Test AU-04:
  Deactivate a user (isActive = false).
  Login with that user's credentials.
  Expected: 401 "Account is deactivated".
```

#### Rate Limiting Tests
```
Test RL-01:
  Send 6 login requests with wrong password in under 60 seconds.
  Expected: 6th request returns 429 Too Many Requests.

Test RL-02:
  Send 4 registration requests from same IP in under 60 seconds.
  Expected: 4th request returns 429 Too Many Requests.
```

---

## 14. Environment Variables Needed

```
# Authentication
JWT_SECRET=minimum_64_character_random_hex_string
JWT_REFRESH_SECRET=different_minimum_64_character_random_hex_string
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# bcrypt
BCRYPT_SALT_ROUNDS=12

# Rate Limiting (values are in milliseconds)
THROTTLE_AUTH_LIMIT=5
THROTTLE_AUTH_TTL=60000
THROTTLE_API_LIMIT=200
THROTTLE_API_TTL=60000
```

### Generate JWT Secrets (run this twice, use different values for each)
```
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Implementation Order

Follow this exact order. Each step must be working before starting the next.

```
Step 1  → Create User schema with organizationId, role, extraPermissions, blockedPermissions
Step 2  → Implement bcrypt password hashing (pre-save hook)
Step 3  → Implement JwtStrategy and JwtAuthGuard
Step 4  → Implement TenantGuard
Step 5  → Build ROLE_PERMISSIONS map in code
Step 6  → Implement @Permission() decorator
Step 7  → Implement RbacGuard using ROLE_PERMISSIONS map
Step 8  → Implement ResourceOwnershipGuard
Step 9  → Implement POST /auth/register (creates org + admin)
Step 10 → Implement POST /auth/login (returns tokens)
Step 11 → Implement POST /auth/refresh
Step 12 → Implement POST /auth/logout
Step 13 → Apply guards to all controllers in correct order
Step 14 → Add rate limiting to auth endpoints
Step 15 → Run all RBAC tests from Section 13
Step 16 → Connect Flutter AuthProvider and role-based routing
Step 17 → Add role-based UI hiding in Flutter screens
```

---

## Guard Pipeline Visual

```
Every API Request
       │
       ▼
┌─────────────────────┐
│   JwtAuthGuard      │ → No token / expired / invalid → 401
│   (Dimension 1)     │
└─────────────────────┘
       │ ✅ valid token, req.user set
       ▼
┌─────────────────────┐
│   TenantGuard       │ → No organizationId → 403
│   (Dimension 2)     │ req.organizationId = req.user.organizationId
└─────────────────────┘
       │ ✅ tenant scoped
       ▼
┌─────────────────────┐
│   RbacGuard         │ → Role lacks permission → 403
│   (Dimension 3)     │ checks ROLE_PERMISSIONS + extras - blocked
└─────────────────────┘
       │ ✅ role has permission
       ▼
┌─────────────────────┐
│ ResourceOwnership   │ → Not owner of resource → 403
│   Guard             │ (skip for admin and staff on most routes)
│   (Dimension 4)     │
└─────────────────────┘
       │ ✅ owns the resource
       ▼
┌─────────────────────┐
│   Controller runs   │ → Returns data
└─────────────────────┘
```

---

*This file is the single source of truth for all RBAC implementation decisions in Institute SaaS. Update this file whenever a new role, permission, or resource is added to the system.*
