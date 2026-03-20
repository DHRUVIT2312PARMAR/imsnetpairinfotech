# Brevo Conversations Chatbot Implementation
## NetPair IMS — Live Chat Widget Setup

**Service:** Brevo Conversations (formerly Sendinblue Chat)  
**Type:** JavaScript widget embedded in React/Vite frontend  
**Cost:** Free tier available  
**Last Updated:** March 2026  

---

## TABLE OF CONTENTS

1. [What is Brevo Conversations](#1-what-is-brevo-conversations)
2. [Subscription & Pricing — Honest Breakdown](#2-subscription--pricing--honest-breakdown)
3. [Security Risks & Analysis](#3-security-risks--analysis)
4. [Implementation in React + Vite](#4-implementation-in-react--vite)
5. [Role-Based Visibility](#5-role-based-visibility)
6. [Customization](#6-customization)
7. [Remove Widget on Specific Pages](#7-remove-widget-on-specific-pages)
8. [Troubleshooting](#8-troubleshooting)
9. [Final Recommendation](#9-final-recommendation)

---

## 1. WHAT IS BREVO CONVERSATIONS

Brevo Conversations is a live chat + chatbot widget that appears as a floating button on your website. When users click it, they can:

- Chat with your support team in real time
- Get automated bot responses when no agent is online
- Leave messages that your team answers later (like email)

Your `BrevoConversationsID` is:
```
69bcd78ccbba0db032059d91
```

This ID is unique to your Brevo account — it connects the widget to your Brevo inbox.

---

## 2. SUBSCRIPTION & PRICING — HONEST BREAKDOWN

### Free plan includes

| Feature | Free Limit |
|---------|-----------|
| Conversations inbox | Unlimited |
| Website widget | 1 website |
| Chat agents | 1 agent |
| Chat history | 30 days |
| Basic bot responses | Yes |
| Email fallback | Yes |
| Brevo branding on widget | Yes (cannot remove) |

### What requires a paid plan

| Feature | Paid Only |
|---------|----------|
| Remove "Powered by Brevo" branding | Yes |
| Multiple agents | Yes (from ~€15/month) |
| Advanced chatbot flows | Yes |
| Chat history > 30 days | Yes |
| Custom widget domain whitelisting | Yes |

### Reality for NetPair IMS

For an internal HR management system with a small team, the **free plan is sufficient**. You get a working live chat widget, bot fallback, and email notifications — all free. The only visible limitation is the "Powered by Brevo" badge on the widget, which is acceptable for an internal tool.

> **Bottom line:** No forced subscription. You can use this indefinitely on the free plan. Paid plans are only needed if you want white-labeling or multiple support agents.

---

## 3. SECURITY RISKS & ANALYSIS

### Risk 1 — Third-party script injection (Medium Risk)

**What it is:**
The widget loads an external JavaScript file from Brevo's CDN:
```
https://conversations-widget.brevo.com/brevo-conversations.js
```
This script runs on your page with full DOM access.

**Risk level:** Medium — same as Google Analytics, Intercom, Freshdesk, or any other third-party chat widget.

**Why it is acceptable:**
- Brevo is a legitimate EU-based company (GDPR compliant)
- The script is loaded over HTTPS — cannot be intercepted
- Your `BrevoConversationsID` is public by design — it only links to your inbox, it does not expose credentials

**Mitigation:**
- Add Brevo's domain to your Content Security Policy (see Section 4.6)
- Only load the widget on pages where it makes sense — not inside the admin dashboard

---

### Risk 2 — Widget ID is public (Low Risk)

**What it is:**
Your `BrevoConversationsID = '69bcd78ccbba0db032059d91'` is visible to anyone who views your page source.

**Risk level:** Low — this is expected and by design.

**What someone can do with it:**
- Nothing harmful — it only links incoming chats to your inbox
- They cannot access your Brevo account, emails, or user data
- They cannot impersonate your widget on another site (Brevo checks the domain)

**What they cannot do:**
- Access your Brevo account
- Read your chat conversations
- Modify your widget settings
- Send emails from your account

---

### Risk 3 — Data collection by third party (Medium Risk)

**What Brevo collects from your users:**
- IP address of the visitor
- Browser and OS information
- Pages visited on your site
- Chat messages if user sends one

**Risk level:** Medium for a public-facing site. Low for an internal HR tool where all users are your employees.

**Mitigation for internal tool:**
Since NetPair IMS is used only by your employees (not public users), data collection risk is minimal. Your employees expect to be using company tools.

**If you ever go public:**
Add a cookie consent banner and mention Brevo in your privacy policy.

---

### Risk 4 — Script loads on admin pages (Low–Medium Risk)

**What it is:**
If the widget loads inside admin pages like `/role-management` or `/audit-logs`, it runs a third-party script that has DOM access on sensitive pages.

**Mitigation:**
Only load the widget on specific pages (support, helpdesk, login) — not globally across all admin pages. See Section 5 for role-based visibility.

---

### Risk 5 — CSP violation without configuration (Low Risk)

**What it is:**
If you have a strict Content Security Policy, the Brevo script will be blocked by the browser.

**Fix:** Add Brevo domains to your CSP (see Section 4.6).

---

### Overall Security Verdict

```
For internal HR tool (employees only):    LOW RISK — safe to use
For public-facing product:               MEDIUM RISK — add privacy policy + CSP
For banking / healthcare:                HIGH RISK — avoid third-party scripts
```

NetPair IMS is an internal tool → **safe to use on the free plan**.

---

## 4. IMPLEMENTATION IN REACT + VITE

### Option A — Add to `index.html` (simplest)

Open `index.html` in your project root and add the script just before `</body>`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NetPair IMS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>

    <!-- Brevo Conversations Widget -->
    <script>
      (function(d, w, c) {
        w.BrevoConversationsID = '69bcd78ccbba0db032059d91';
        w[c] = w[c] || function() {
          (w[c].q = w[c].q || []).push(arguments);
        };
        var s = d.createElement('script');
        s.async = true;
        s.src = 'https://conversations-widget.brevo.com/brevo-conversations.js';
        if (d.head) d.head.appendChild(s);
      })(document, window, 'BrevoConversations');
    </script>
    <!-- /Brevo Conversations -->

  </body>
</html>
```

**Result:** Widget appears on every page of your app.

---

### Option B — React component (recommended — more control)

Create file: `src/components/BrevoChat.jsx`

```jsx
import { useEffect } from 'react';

const BrevoChat = ({ visible = true }) => {
  useEffect(() => {
    // Load the Brevo script only once
    if (window.BrevoConversationsID) return;

    window.BrevoConversationsID = '69bcd78ccbba0db032059d91';
    window.BrevoConversations = window.BrevoConversations || function() {
      (window.BrevoConversations.q = window.BrevoConversations.q || []).push(arguments);
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://conversations-widget.brevo.com/brevo-conversations.js';
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount (optional)
    };
  }, []);

  // Show or hide the widget based on the visible prop
  useEffect(() => {
    if (!window.BrevoConversations) return;

    if (visible) {
      window.BrevoConversations('show');
    } else {
      window.BrevoConversations('hide');
    }
  }, [visible]);

  return null; // This component renders nothing — widget is injected by Brevo
};

export default BrevoChat;
```

---

### Option C — Load only on specific pages (best for admin tools)

Use in `App.jsx` with route-based control:

```jsx
import { useLocation } from 'react-router-dom';
import BrevoChat from './components/BrevoChat';

function App() {
  const location = useLocation();

  // Only show chat on these pages
  const chatPages = ['/', '/registration', '/helpdesk', '/notifications'];
  const showChat  = chatPages.includes(location.pathname);

  return (
    <>
      <BrevoChat visible={showChat} />
      {/* Your existing routes here */}
    </>
  );
}
```

---

### 4.6 Content Security Policy (CSP) — add if you have one

If your backend sends CSP headers, add Brevo domains to `backend/server.js`:

```javascript
const helmet = require('helmet');

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc:  ["'self'"],
    scriptSrc:   [
      "'self'",
      "'unsafe-inline'",
      "https://conversations-widget.brevo.com",
    ],
    connectSrc:  [
      "'self'",
      "https://conversations-widget.brevo.com",
      "wss://conversations-widget.brevo.com",
      "https://api.brevo.com",
    ],
    imgSrc:      ["'self'", "data:", "https://conversations-widget.brevo.com"],
    frameSrc:    ["https://conversations-widget.brevo.com"],
    styleSrc:    ["'self'", "'unsafe-inline'", "https://conversations-widget.brevo.com"],
  },
}));
```

---

## 5. ROLE-BASED VISIBILITY

For NetPair IMS, the chat widget is most useful for employees and HR — not for admins who are managing the system. Use role-based visibility:

```jsx
import { useAuth } from '../context/AuthContext';
import BrevoChat  from './BrevoChat';

const ChatWrapper = () => {
  const { user } = useAuth();

  // Show chat for employee and hr only
  // Hide for admin and superAdmin (they manage the system, not use support)
  const showForRole = ['employee', 'hr'].includes(user?.role);

  // Also hide on system-sensitive pages
  const location   = useLocation();
  const hiddenPages = [
    '/role-management',
    '/audit-logs',
    '/system-configuration',
  ];
  const onHiddenPage = hiddenPages.includes(location.pathname);

  return <BrevoChat visible={showForRole && !onHiddenPage} />;
};

export default ChatWrapper;
```

Use `<ChatWrapper />` in your `App.jsx` instead of `<BrevoChat />` directly.

---

## 6. CUSTOMIZATION

### Change widget color and position

Add this before the Brevo script loads (in `index.html` or in `BrevoChat.jsx` before the script):

```javascript
window.BrevoConversations('config', {
  // Widget theme color (match NetPair brand)
  color: '#1a3fb5',

  // Position: 'right' or 'left'
  position: 'right',

  // Bottom offset in pixels
  bottomOffset: 20,
});
```

### Pre-fill user info when logged in

After user logs in, pass their info to Brevo so agents know who they are:

```javascript
// Call this after successful login in AuthContext.jsx
// or in the Dashboard component after user loads

if (window.BrevoConversations && user) {
  window.BrevoConversations('identify', {
    id:    user._id,
    email: user.personalEmail,
    name:  `${user.firstName} ${user.lastName}`,
    // Custom attributes
    role:  user.role,
    dept:  user.profile?.department || 'Not set',
  });
}
```

Add this to `AuthContext.jsx` inside the login success handler:

```javascript
const login = async (systemEmail, password) => {
  // ... your existing login code ...

  // After user is set:
  if (window.BrevoConversations) {
    window.BrevoConversations('identify', {
      id:    data.user._id,
      email: data.user.personalEmail,
      name:  `${data.user.firstName} ${data.user.lastName}`,
      role:  data.user.role,
    });
  }
};
```

### Clear user on logout

```javascript
const logout = () => {
  // ... your existing logout code ...

  // Clear Brevo identity on logout
  if (window.BrevoConversations) {
    window.BrevoConversations('reset');
  }

  localStorage.clear();
  setUser(null);
  setIsAuthenticated(false);
};
```

---

## 7. REMOVE WIDGET ON SPECIFIC PAGES

### Hide on login / registration pages

You may not want the chat widget floating over the auth pages:

```jsx
// In AuthLayout.jsx or Lform.jsx
useEffect(() => {
  // Hide widget on auth pages
  if (window.BrevoConversations) {
    window.BrevoConversations('hide');
  }

  return () => {
    // Show again when leaving auth pages
    if (window.BrevoConversations) {
      window.BrevoConversations('show');
    }
  };
}, []);
```

### Full page list — recommended visibility

| Page | Show Widget? | Reason |
|------|-------------|--------|
| `/` (login) | No | Clutters the auth form |
| `/registration` | No | Clutters the auth form |
| `/dashboard` | Yes (employee/hr) | Main workspace |
| `/helpdesk` | Yes (all) | Support page — makes sense |
| `/notifications` | Yes | Helpful |
| `/attendance` | Yes (employee) | Employee may need help |
| `/leave` | Yes (employee) | Employee may need help |
| `/role-management` | No | Admin system page |
| `/audit-logs` | No | Admin system page |
| `/system-configuration` | No | Admin system page |
| `/payroll` | No | Sensitive financial page |

---

## 8. TROUBLESHOOTING

### Widget not appearing

```
Check 1: Open browser console — any CSP errors?
         Fix: Add Brevo domains to Content Security Policy (see Section 4.6)

Check 2: Is the script loading? Network tab → filter by "brevo"
         Should see: brevo-conversations.js loading with status 200

Check 3: Is BrevoConversationsID set before the script loads?
         The ID must be set BEFORE the script tag
```

### Widget appears then disappears

```
Cause:  React re-renders calling hide() unintentionally
Fix:    Move the BrevoChat component outside the router so it
        does not unmount on navigation
```

### Widget blocks content on mobile

```
Fix:    Add bottom padding to page content on mobile
        Or use the bottomOffset config to move it up
```

### Double widget (widget loads twice)

```
Cause:  Script injected twice — happens if BrevoChat mounts twice
Fix:    Add guard at the top of useEffect:
        if (window.BrevoConversationsID) return;
        (already included in the component above)
```

### User identity not showing in Brevo inbox

```
Cause:  identify() called before widget script finishes loading
Fix:    Wrap in a timeout or check after script load event:
        script.onload = () => {
          window.BrevoConversations('identify', { ... });
        };
```

---

## 9. FINAL RECOMMENDATION

### Use it — with these conditions

```
✓  Use it for employee and hr roles
✓  Hide it on admin/superAdmin pages
✓  Hide it on login and registration
✓  Pass user identity after login (name, email, role)
✓  Clear identity on logout
✓  Add CSP headers if using Helmet
✗  Do not show on role-management, audit-logs, payroll pages
✗  Do not show on system-configuration page
```

### Subscription verdict

```
Free plan is enough for NetPair IMS.
Only upgrade if:
  - You need to remove the "Powered by Brevo" badge
  - You add more than 1 support agent
  - You need chat history beyond 30 days
```

### Security verdict

```
Safe for internal HR tool. No sensitive data is exposed.
The BrevoConversationsID being public is by design and not a risk.
The only medium risk is third-party script access — mitigated by
hiding the widget on sensitive admin pages.
```

### Quickest setup path

```
1. Add script to index.html (Option A)       → 2 minutes
2. Test widget appears on homepage           → 1 minute
3. Move to BrevoChat.jsx component           → 10 minutes
4. Add role-based visibility via ChatWrapper → 15 minutes
5. Pass user identity after login            → 10 minutes
Total: ~40 minutes to full production-ready setup
```

---

## QUICK REFERENCE

### Key files

```
index.html                         Add script tag (Option A)
src/components/BrevoChat.jsx       React component wrapper (Option B/C)
src/context/AuthContext.jsx        Add identify() on login, reset() on logout
backend/server.js                  Add CSP headers for Brevo domains
```

### Brevo Conversations API

```javascript
window.BrevoConversations('show')              // Show widget
window.BrevoConversations('hide')              // Hide widget
window.BrevoConversations('toggle')            // Toggle open/close
window.BrevoConversations('reset')             // Clear user identity (on logout)
window.BrevoConversations('identify', {...})   // Pass user info
window.BrevoConversations('config', {...})     // Set color, position
```

### Your widget ID

```
69bcd78ccbba0db032059d91
```

---

*Brevo Conversations free plan: unlimited chats, 1 agent, 30-day history, Brevo branding.*  
*Security: safe for internal tools, hide on admin/sensitive pages, add CSP if using Helmet.*
