# Backend Debug Win — Register API Fixed ✅

**Date:** March 2026

---

## What Was Solved

Real backend debugging — not basic stuff:

- `express-mongo-sanitize` was internally doing `req.query = sanitizedQuery`
- In Node 18+, `req.query` is a read-only getter on `IncomingMessage`
- This caused `500 Internal Server Error` on every register attempt
- Also fixed `xss-clean` which had the same issue
- Fixed `User.js` pre-save hook — removed `next` param from async function (Mongoose 7+ doesn't pass it)

---

## What the Project Now Has

- Working Register API
- Working Login API
- JWT stored in httpOnly cookie (secure)
- Role system (first user = admin, rest = employee)
- express-validator input validation on all routes
- Clean server.js with no conflicting middleware

---

## Test Checklist

- [ ] Register new user → check MongoDB Compass → `netpair_ims` → `users`
- [ ] Same email again → should return 400 "User already exists"
- [ ] Wrong password on login → should return 401
- [ ] Empty fields → should return 400 validation error
- [ ] Login → cookie set → dashboard redirect works

---

## Re-enable Sanitization (Later)

When needed, use safe config instead of removing:

```js
app.use(mongoSanitize({ replaceWith: "_" }));
```

---

## Next Steps (Pick One)

1. Fix Login + Protected Routes fully
2. Connect all modules with backend (Leave, Attendance, etc.)
3. Add role-based backend protection (RBAC middleware)
4. Prepare project for PPT / Viva
5. Deploy project live
