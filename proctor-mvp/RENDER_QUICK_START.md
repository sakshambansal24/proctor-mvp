# Render Deployment - Quick Start Guide

## 🚀 Quick Steps to Deploy

### 1. Sign Up & Connect GitHub
- Go to https://render.com/
- Sign up with GitHub
- Authorize Render access

### 2. Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Select your repository: `proctor-mvp`
3. Configure:
   - **Name:** `proctor-mvp-server`
   - **Root Directory:** `server` ⚠️ **IMPORTANT!**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** `Free`

### 3. Set Environment Variables
In Render dashboard → Your service → **Environment**:

```
NODE_ENV = production
PORT = 3000
MONGODB_URI = mongodb+srv://user:pass@cluster.mongodb.net/proctor-mvp?retryWrites=true&w=majority
JWT_SECRET = (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
CORS_ORIGIN = https://your-frontend.netlify.app
```

### 4. Deploy
- Click **"Create Web Service"**
- Watch build logs
- Get your URL: `https://your-app.onrender.com`

### 5. Set Up MongoDB Atlas (Free)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Add to Render as `MONGODB_URI`

### 6. Keep App Awake (Optional)
- Sign up at https://uptimerobot.com/
- Monitor: `https://your-app.onrender.com/api/health`
- Interval: 5 minutes

## ✅ That's It!

Your server is now live on Render (free tier)!

## 📝 Important Notes

- ⚠️ **Root Directory must be `server`**
- ⚠️ App sleeps after 15 min inactivity (use UptimeRobot)
- ✅ Auto-deploys on git push
- ✅ Free SSL included

For detailed instructions, see [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
