# Attendance Clock-In Error — Root Cause & Fix
## NetPair IMS — March 2026

---

## THE ERROR

```
Route /api/v1/attendance/clock-in not found
Failed to load attendance data
```

---

## ROOT CAUSES (3 bugs)

### Bug 1 — Wrong import in App.jsx (primary cause of role split not working)

When `Attendance.jsx` was renamed to `HRAttendance.jsx` using `smartRelocate`,
the tool auto-updated the import in `App.jsx` to point directly to `HRAttendance.jsx`,
bypassing the role router entirely.

```js
// WRONG — was auto-updated to this:
import Attendance from "./user/Admin_Attendance/HRAttendance";

// CORRECT — should be the role router:
import Attendance from "./user/Admin_Attendance/Attendance";
```

**Effect:** Every role (including employee) was seeing the HR/Admin view.

---

### Bug 2 — Wrong ID used in attendance queries

The `Attendance` model stores `employeeId` as a reference to the `Employee` collection
(`ref: "Employee"`). But the new controller functions were querying with `req.user._id`
which is the `User` collection ObjectId — a completely different document.

```js
// WRONG — User._id !== Employee._id
await Attendance.findOne({ employeeId: req.user._id, date });

// CORRECT — look up Employee first, then use emp._id
const emp = await Employee.findOne({ userId: req.user._id });
await Attendance.findOne({ employeeId: emp._id, date });
```

**Effect:** All employee-specific queries returned empty / null even when records existed.
Clock-in created records that could never be found again.

---

### Bug 3 — Wrong response shape for my-history

The `getMyHistory` controller was returning `{ records, pagination }` as the data object,
but the frontend was reading `historyRes.data.data` expecting a plain array.

```js
// WRONG — wraps records in an object
respond(res, 200, "History fetched", { records, pagination: { ... } });
// Frontend reads: historyRes.data.data → gets { records: [...], pagination: {...} }
// Then: setHistory(historyRes.data.data || []) → sets an object, not array → map() crashes

// CORRECT — return records directly as the data value
respond(res, 200, "History fetched", records);
```

---

### Bug 4 — mode enum mismatch

The `Attendance` model defines `mode` enum as `["Office", "WFH", "Hybrid", ""]` (capitalized),
but the clock-in was saving lowercase values like `"office"`, `"home"` which fail Mongoose validation.

```js
// WRONG
mode: mode || "office"   // saves "office" → rejected by enum

// CORRECT — map to model enum values
const modeMap = { office: "Office", home: "WFH", "client-site": "Office" };
mode: modeMap[mode] || "Office"
```

---

## FIXES APPLIED

| File | Change |
|------|--------|
| `src/App.jsx` | Fixed import to use `Attendance.jsx` (role router) not `HRAttendance.jsx` |
| `backend/controllers/attendanceController.js` | All employee endpoints now look up `Employee.findOne({ userId: req.user._id })` first |
| `backend/controllers/attendanceController.js` | `getMyHistory` returns plain array as `data`, not wrapped object |
| `backend/controllers/attendanceController.js` | `clockIn` maps mode string to correct enum values |
| `backend/controllers/attendanceController.js` | All endpoints return 404 with helpful message if no Employee profile found |

---

## IMPORTANT — RESTART BACKEND

After any backend file change, the Node.js server must be restarted to pick up changes:

```bash
# In the backend folder:
node server.js
# or if using nodemon:
nodemon server.js
```

The "Route not found" error will persist until the server is restarted.

---

## HOW THE SYSTEM WORKS NOW

```
Employee visits /attendance
  → App.jsx imports Attendance.jsx (role router)
  → role router checks user.role
  → "employee" → renders EmployeeAttendance.jsx
  → hr/admin/superAdmin → renders HRAttendance.jsx

EmployeeAttendance.jsx calls:
  GET /attendance/my-today    → finds Employee by userId → finds today's record
  GET /attendance/my-summary  → finds Employee by userId → counts this month
  GET /attendance/my-history  → finds Employee by userId → returns last 20 records
  POST /attendance/clock-in   → finds Employee by userId → creates/updates record
  POST /attendance/clock-out  → finds Employee by userId → updates checkOut + hours
```

---

## EMPLOYEE PROFILE REQUIREMENT

For clock-in/out to work, the logged-in user must have a corresponding `Employee` document
with `userId` pointing to their `User._id`.

If an employee sees "Employee profile not found. Contact HR." — HR needs to create
their employee record in the Employees page and link it to their user account.
