# Production Setup Guide

## ✅ Backend (Render) - Already Deployed
**URL:** https://imsnetpairinfotech.onrender.com

### Backend Configuration Checklist
- [x] Deployed to Render
- [x] Environment variables configured
- [x] CORS allows Vercel frontend
- [x] MongoDB Atlas connection working
- [x] Health check endpoint: `/health`

---

## ✅ Frontend (Vercel) - Configuration

### 1. Environment Variables in Vercel Dashboard

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add this variable:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_API_BASE_URL` | `https://imsnetpairinfotech.onrender.com/api/v1` | Production, Preview, Development |

### 2. Automatic Configuration

The following files have been configured for production:

- ✅ `src/services/api.js` - Auto-detects production and uses Render URL
- ✅ `.env.production` - Production environment variables
- ✅ `.env.development` - Development environment variables
- ✅ `vercel.json` - Vercel deployment configuration

---

## 🔄 How It Works

### Development (Local)
```bash
npm run dev
```
- Uses `http://localhost:3000/api/v1`
- Reads from `.env.development`

### Production (Vercel)
```bash
npm run build
```
- Uses `https://imsnetpairinfotech.onrender.com/api/v1`
- Reads from `.env.production` or Vercel environment variables
- Auto-deployed on every push to `main` branch

---

## 🧪 Testing Production Setup

### 1. Test Backend Health
```bash
curl https://imsnetpairinfotech.onrender.com/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "env": "production"
}
```

### 2. Test Frontend API Connection

After deploying to Vercel:
1. Open browser console (F12)
2. Go to your Vercel URL
3. Try logging in
4. Check Network tab for API calls to Render

---

## 🚀 Deployment Steps

### Deploy Frontend to Vercel

1. **Push to GitHub:**
   ```bash
   git add -A
   git commit -m "feat: Configure production backend URL"
   git push target main
   ```

2. **Vercel Auto-Deploy:**
   - Vercel automatically detects the push
   - Builds and deploys your frontend
   - Uses production environment variables

3. **Verify Deployment:**
   - Check Vercel deployment logs
   - Visit your Vercel URL
   - Test login functionality

---

## 🔧 Configuration Files Explained

### `src/services/api.js`
- Automatically uses Render URL in production
- Uses localhost in development
- Handles authentication with cookies
- 30-second timeout for Render cold starts

### `.env.production`
- Used during `npm run build`
- Sets `VITE_API_BASE_URL` to Render
- Committed to Git (no secrets)

### `.env.development`
- Used during `npm run dev`
- Sets `VITE_API_BASE_URL` to localhost
- Committed to Git (no secrets)

### `vercel.json`
- Configures Vercel deployment
- Sets up SPA routing (all routes → index.html)
- Optimizes asset caching
- Sets production environment variables

---

## 🔐 Security Checklist

- [x] Backend uses HTTPS (Render provides SSL)
- [x] Frontend uses HTTPS (Vercel provides SSL)
- [x] CORS properly configured
- [x] Credentials (cookies) sent securely
- [x] Environment variables not exposed in frontend
- [x] MongoDB connection string secure
- [x] JWT secrets not exposed

---

## 📊 Monitoring

### Backend (Render)
- **Logs:** Render Dashboard → Logs tab
- **Metrics:** Render Dashboard → Metrics tab
- **Health:** https://imsnetpairinfotech.onrender.com/health

### Frontend (Vercel)
- **Logs:** Vercel Dashboard → Deployments → View Function Logs
- **Analytics:** Vercel Dashboard → Analytics tab
- **Performance:** Vercel Dashboard → Speed Insights

---

## ⚠️ Important Notes

### Render Free Tier
- **Cold Starts:** Service sleeps after 15 minutes of inactivity
- **First Request:** May take 30-60 seconds to wake up
- **Solution:** Upgrade to paid tier ($7/month) for always-on

### MongoDB Atlas
- Ensure Network Access allows `0.0.0.0/0` (all IPs)
- Or add Render's IP addresses to whitelist

### Vercel
- Free tier includes:
  - Unlimited deployments
  - Automatic HTTPS
  - Global CDN
  - 100GB bandwidth/month

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to backend"
**Check:**
1. Render service is running (not sleeping)
2. CORS configuration in backend
3. Environment variables in Vercel
4. Browser console for errors

**Solution:**
```bash
# Test backend directly
curl https://imsnetpairinfotech.onrender.com/health

# Check Render logs
# Render Dashboard → Logs
```

### Issue: "CORS Error"
**Check:**
1. Backend `FRONTEND_URL` matches Vercel URL exactly
2. Include protocol (https://)
3. No trailing slash

**Solution:**
Update backend environment variable on Render:
```
FRONTEND_URL=https://imsnetpairinfotech.vercel.app
```

### Issue: "Slow first request"
**Cause:** Render free tier cold start

**Solutions:**
1. Upgrade to paid tier ($7/month)
2. Use a cron job to ping every 10 minutes
3. Accept 30-60s delay on first request

---

## 📝 Next Steps

1. ✅ Push changes to GitHub
2. ✅ Verify Vercel auto-deploys
3. ✅ Test login on production
4. ✅ Test all features
5. ✅ Monitor logs for errors
6. ✅ Set up error tracking (optional: Sentry)
7. ✅ Set up uptime monitoring (optional: UptimeRobot)

---

## 🎉 Production URLs

- **Frontend:** https://imsnetpairinfotech.vercel.app
- **Backend:** https://imsnetpairinfotech.onrender.com
- **Backend Health:** https://imsnetpairinfotech.onrender.com/health
- **API Base:** https://imsnetpairinfotech.onrender.com/api/v1

---

## 📞 Support

If you encounter issues:
1. Check Render logs
2. Check Vercel deployment logs
3. Check browser console
4. Test backend health endpoint
5. Verify environment variables
