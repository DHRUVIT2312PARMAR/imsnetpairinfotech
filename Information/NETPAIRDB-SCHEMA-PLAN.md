# netpairDB — Complete Schema Plan (Audited)

> Audited against all 20 frontend pages + components on 2026-03-19
> Status: READY FOR IMPLEMENTATION — waiting for user command

---

## Database

- Name: `netpairDB`
- URI: `mongodb://localhost:27017/netpairDB`
- Change: update `MONGODB_URI` in `netpair/backend/.env`

---

## Audit Findings — Gaps Found & Fixed

### GAP 1 — Announcements (no model existed)
Frontend uses: `title`, `msg`, `category`, `pinned`, `date`, `time`
Action: ADD `Announcement` model

### GAP 2 — WFH Requests (no model existed)
Frontend has `/wfh` route and "WFH Request" quick action
Action: ADD `WFHRequest` model

### GAP 3 — Helpdesk Tickets (no model existed)
Frontend has `/helpdesk` route
Action: ADD `Ticket` model

### GAP 4 — Project status mismatch
Frontend uses: `"Ongoing"`, `"Completed"`, `"On Hold"`
Current schema uses: `"Planning"`, `"In Progress"`, `"On Hold"`, `"Completed"`, `"Cancelled"`
Action: ADD `"Ongoing"` to Project status enum (keep others too)

### GAP 5 — Task fields mismatch
Frontend uses: `employee` (name string), `task` (title), `startDate`, `deadline`, `hours`, `date`
Schema uses ObjectId refs — correct for DB, but need `startDate` field (not just `dueDate`)
Action: ADD `startDate` field to Task model

### GAP 6 — Attendance table uses different field names
Frontend `AttendanceTable` uses: `item.name`, `item.dept`, `item.in`, `item.out`, `item.mode`
Schema uses: `employeeName`, `department`, `checkIn`, `checkOut`, `mode`
Action: Frontend mapping needed (no schema change — schema names are correct)

### GAP 7 — Leave type mismatch
Frontend `LeaveFilter` shows: `"Casual"`, `"Sick"`, `"Paid"`
Schema has: `"Annual"`, `"Sick"`, `"Casual"`, `"Emergency"`
Action: ADD `"Paid"` to Leave type enum

### GAP 8 — Inventory page (no model)
Frontend has `/inventory` route
Action: ADD `InventoryItem` model

### GAP 9 — Notification `desc` → `message` rename
Frontend `Notification.js` model uses `desc`
Plan renames to `message` + adds `link` field
Action: CONFIRMED — rename in new schema

### GAP 10 — Payroll `netSalary` should be auto-calculated
Formula: `basicSalary + allowances + overtime + bonus - deductions - tax`
Action: Add pre-save hook to auto-calculate

---

## Final Collections (12 total)

### 1. `users`

| Field | Type | Notes |
|---|---|---|
| `username` | String | required, trimmed |
| `email` | String | required, unique, lowercase |
| `password` | String | required, min 6, `select: false` |
| `role` | String | enum: `employee / hr / admin / superAdmin` |
| `avatar` | String | default `""` |
| `isActive` | Boolean | default `true` |
| `lastLogin` | Date | updated on login |
| `employeeRef` | ObjectId → Employee | optional link |

Indexes: `email` (unique)

---

### 2. `employees`

| Field | Type | Notes |
|---|---|---|
| `employeeId` | String | auto `NP-0001`, unique |
| `userId` | ObjectId → User | optional |
| `firstName` | String | required |
| `lastName` | String | default `""` |
| `dateOfBirth` | Date | |
| `gender` | String | enum: `Male / Female / Other / ""` |
| `avatar` | String | default `""` |
| `email` | String | required, unique, lowercase |
| `phone` | String | default `""` |
| `address` | String | default `""` |
| `department` | String | required, indexed |
| `designation` | String | required |
| `employmentType` | String | enum: `Full Time / Part Time / Intern / Contract` |
| `joiningDate` | Date | default `Date.now` |
| `reportingManager` | String | default `""` |
| `basicSalary` | Number | default 0 |
| `allowances` | Number | default 0 |
| `deductions` | Number | default 0 |
| `status` | String | enum: `active / inactive / terminated`, indexed |
| `statusReason` | String | default `""` |
| `statusUpdatedAt` | Date | |

Virtuals: `fullName`, `netSalary`

---

### 3. `attendances`

| Field | Type | Notes |
|---|---|---|
| `employeeId` | ObjectId → Employee | required, indexed |
| `employeeName` | String | denormalized |
| `department` | String | denormalized, indexed |
| `date` | String | `"YYYY-MM-DD"`, indexed |
| `checkIn` | String | `"HH:MM"` or `"-"` |
| `checkOut` | String | `"HH:MM"` or `"-"` |
| `workingHours` | Number | calculated |
| `status` | String | enum: `Present / Absent / Half Day / WFH`, indexed |
| `mode` | String | enum: `Office / WFH / Hybrid / ""` |
| `isLate` | Boolean | default false |
| `lateMinutes` | Number | default 0 |
| `notes` | String | default `""` |
| `markedBy` | ObjectId → User | |

Compound unique: `{ employeeId, date }`

---

### 4. `leaves`

| Field | Type | Notes |
|---|---|---|
| `employeeId` | ObjectId → Employee | required, indexed |
| `employeeName` | String | required |
| `type` | String | enum: `Annual / Sick / Casual / Emergency / Paid`, indexed |
| `fromDate` | String | `"YYYY-MM-DD"` |
| `toDate` | String | `"YYYY-MM-DD"` |
| `days` | Number | min 1 |
| `reason` | String | default `""` |
| `status` | String | enum: `Pending / Approved / Rejected`, indexed |
| `approvedBy` | ObjectId → User | |
| `approvedAt` | Date | |
| `rejectedReason` | String | default `""` |

Leave balance totals: Annual=12, Sick=8, Casual=6, Emergency=4, Paid=12

---

### 5. `projects`

| Field | Type | Notes |
|---|---|---|
| `title` | String | required (frontend uses `name` → map in controller) |
| `description` | String | default `""` |
| `client` | String | default `""` |
| `status` | String | enum: `Planning / Ongoing / In Progress / On Hold / Completed / Cancelled`, indexed |
| `priority` | String | enum: `Low / Medium / High / Critical` |
| `startDate` | Date | (frontend: `start`) |
| `deadline` | Date | (frontend: `end`) |
| `completedAt` | Date | |
| `budget` | Number | default 0 |
| `spent` | Number | default 0 |
| `manager` | ObjectId → Employee | |
| `teamMembers` | [ObjectId → Employee] | |
| `tags` | [String] | |
| `progress` | Number | 0–100, default 0 |
| `createdBy` | ObjectId → User | |

---

### 6. `tasks`

| Field | Type | Notes |
|---|---|---|
| `title` | String | required |
| `description` | String | default `""` |
| `projectId` | ObjectId → Project | indexed |
| `assignedTo` | ObjectId → Employee | indexed |
| `assignedBy` | ObjectId → User | |
| `status` | String | enum: `Assigned / Todo / In Progress / Review / Done / Completed / Pending`, indexed |
| `priority` | String | enum: `Low / Medium / High` |
| `startDate` | Date | (GAP 5 fix) |
| `dueDate` | Date | (frontend: `deadline`) |
| `completedAt` | Date | |
| `estimatedHours` | Number | default 0 |
| `loggedHours` | Number | default 0 |
| `tags` | [String] | |

---

### 7. `payrolls`

| Field | Type | Notes |
|---|---|---|
| `employeeId` | ObjectId → Employee | required, indexed |
| `employeeName` | String | required |
| `department` | String | |
| `month` | Number | 1–12 |
| `year` | Number | |
| `basicSalary` | Number | default 0 |
| `allowances` | Number | default 0 |
| `overtime` | Number | default 0 |
| `bonus` | Number | default 0 |
| `deductions` | Number | default 0 |
| `tax` | Number | default 0 |
| `netSalary` | Number | auto-calculated pre-save |
| `workingDays` | Number | default 0 |
| `presentDays` | Number | default 0 |
| `leaveDays` | Number | default 0 |
| `status` | String | enum: `Draft / Processed / Paid`, indexed |
| `paidAt` | Date | |
| `processedBy` | ObjectId → User | |

Compound unique: `{ employeeId, month, year }`

---

### 8. `assets`

| Field | Type | Notes |
|---|---|---|
| `assetId` | String | auto `AST-0001`, unique |
| `name` | String | required |
| `category` | String | enum: `Laptop / Mobile / Monitor / Keyboard / Mouse / Other`, indexed |
| `description` | String | default `""` |
| `serialNumber` | String | default `""` |
| `purchaseDate` | Date | |
| `purchasePrice` | Number | default 0 |
| `warrantyUntil` | Date | |
| `status` | String | enum: `Available / Assigned / Under Repair / Retired`, indexed |
| `assignedTo` | ObjectId → Employee | |
| `assignedAt` | Date | |
| `returnedAt` | Date | |
| `condition` | String | enum: `New / Good / Fair / Poor` |
| `notes` | String | default `""` |

---

### 9. `notifications`

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId → User | required, indexed |
| `type` | String | enum: `Leave / Attendance / Announcement / Task / Payroll / System` |
| `title` | String | required |
| `message` | String | required (renamed from `desc`) |
| `read` | Boolean | default false, indexed |
| `link` | String | optional route, default `""` |

---

### 10. `announcements` ← NEW (GAP 1)

| Field | Type | Notes |
|---|---|---|
| `title` | String | required |
| `msg` | String | required |
| `category` | String | enum: `General / HR / IT / Event`, default `General` |
| `pinned` | Boolean | default false |
| `createdBy` | ObjectId → User | |

---

### 11. `wfhrequests` ← NEW (GAP 2)

| Field | Type | Notes |
|---|---|---|
| `employeeId` | ObjectId → Employee | required, indexed |
| `employeeName` | String | required |
| `date` | String | `"YYYY-MM-DD"`, required |
| `reason` | String | default `""` |
| `status` | String | enum: `Pending / Approved / Rejected`, indexed |
| `approvedBy` | ObjectId → User | |
| `approvedAt` | Date | |

---

### 12. `tickets` ← NEW (GAP 3 — Helpdesk)

| Field | Type | Notes |
|---|---|---|
| `ticketId` | String | auto `TKT-0001`, unique |
| `employeeId` | ObjectId → Employee | required, indexed |
| `employeeName` | String | required |
| `subject` | String | required |
| `description` | String | default `""` |
| `category` | String | enum: `IT / HR / Admin / Other`, default `Other` |
| `priority` | String | enum: `Low / Medium / High`, default `Medium` |
| `status` | String | enum: `Open / In Progress / Resolved / Closed`, indexed |
| `assignedTo` | ObjectId → User | support agent |
| `resolvedAt` | Date | |
| `notes` | String | default `""` |

---

## Pagination Response (all list endpoints)

```json
{
  "success": true,
  "data": {
    "data": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "pages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

Query params: `?page=1&limit=20&sortBy=createdAt&order=desc`

---

## MongoDB Steps (do this BEFORE running backend)

1. Open **MongoDB Compass**
2. Connect to `mongodb://localhost:27017`
3. Click **"+ Create Database"**
4. Database Name: `netpairDB`
5. Collection Name: `users` (first collection — others auto-create)
6. Click **Create Database**
7. Done — Mongoose will auto-create all other collections on first insert

OR via **mongosh** terminal:
```js
use netpairDB
db.createCollection("users")
```

---

## Files to Create / Update

| Action | File |
|---|---|
| UPDATE | `backend/.env` → `MONGODB_URI=mongodb://localhost:27017/netpairDB` |
| REWRITE | `backend/models/User.js` |
| REWRITE | `backend/models/Employee.js` |
| REWRITE | `backend/models/Attendance.js` |
| REWRITE | `backend/models/Leave.js` |
| REWRITE | `backend/models/Project.js` |
| REWRITE | `backend/models/Task.js` |
| REWRITE | `backend/models/Payroll.js` |
| REWRITE | `backend/models/Asset.js` |
| REWRITE | `backend/models/Notification.js` |
| CREATE | `backend/models/Announcement.js` |
| CREATE | `backend/models/WFHRequest.js` |
| CREATE | `backend/models/Ticket.js` |
| KEEP | `backend/utils/paginate.js` (already correct) |
| UPDATE | `backend/server.js` (preload all 12 models) |

---

## Implementation Checklist

- [ ] User approves this plan
- [ ] MongoDB `netpairDB` created (user does this — see steps above)
- [ ] `.env` updated
- [ ] All 12 models written
- [ ] `server.js` updated
- [ ] Backend restarted → indexes auto-created

---

**Waiting for: `implement` command from user**
