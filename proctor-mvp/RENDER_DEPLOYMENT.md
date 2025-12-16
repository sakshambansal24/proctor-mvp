# Render Deployment Guide

Render offers a **free tier** perfect for deploying your Proctor MVP server!

## Render Free Tier Benefits

✅ **750 hours/month free** (enough for 24/7 operation)  
✅ **Automatic deployments** from GitHub  
✅ **Free SSL certificates**  
✅ **No credit card required** (for free tier)  
⚠️ **Sleeps after 15 minutes of inactivity** (wakes on first request)

## Prerequisites

1. Render account (sign up at https://render.com/)
2. GitHub repository with your code
3. MongoDB instance (MongoDB Atlas free tier recommended)

## Step-by-Step Deployment

### Step 1: Prepare Your Code

Make sure your code is committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Create Render Account

1. Go to https://render.com/
2. Click **"Get Started for Free"**
3. Sign up with GitHub (recommended for easy integration)
4. Authorize Render to access your repositories

### Step 3: Create New Web Service

#### Option A: Using Render Dashboard (Recommended for First Time)

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository (if not already connected)
3. Select your repository: `proctor-mvp`
4. Configure the service:

##### Basic Settings

- **Name:** `proctor-mvp-server` (or your preferred name)
- **Region:** Choose closest to you (e.g., `Oregon (US West)`)
- **Branch:** `main` (or your default branch)
- **Root Directory:** `server` ⚠️ **IMPORTANT!** This tells Render where your server code is

##### Build & Deploy Settings

- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Plan:** `Free` ✅

##### Environment Variables

Click **"Add Environment Variable"** and add these one by one:

```
NODE_ENV = production
PORT = 3000
MONGODB_URI = (your MongoDB connection string - see Step 4)
JWT_SECRET = (generate a secure secret - see below)
CORS_ORIGIN = (set after deploying frontend - can use https://your-app.onrender.com for now)
```

**Generate JWT Secret:**
```bash
# Run this locally to generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. Click **"Create Web Service"**
6. Render will start building and deploying
7. Watch the build logs in real-time
8. Once deployed, you'll get a URL like: `https://proctor-mvp-server.onrender.com`

#### Option B: Using Blueprint (render.yaml)

If you prefer Infrastructure as Code:

1. The `render.yaml` file is already created in your project root
2. In Render dashboard, click **"New +"** → **"Blueprint"**
3. Connect your repository
4. Render will detect `render.yaml` and create the service
5. **Still need to set environment variables manually** in the dashboard

### Step 4: Set Up MongoDB

#### Option A: MongoDB Atlas (Recommended - Free)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a free cluster (M0 - Free)
4. **Set up database access:**
   - Go to "Database Access"
   - Create a database user
   - Remember username and password
5. **Set up network access:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
6. **Get connection string:**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/proctor-mvp?retryWrites=true&w=majority`

7. **Add to Render:**
   - Go to your Render service
   - Settings → Environment
   - Add: `MONGODB_URI` = your connection string

#### Option B: Render PostgreSQL (Not Recommended - Your app uses MongoDB)

Your app uses MongoDB, so stick with MongoDB Atlas.

### Step 5: Update Environment Variables

After getting your Render URL, update:

1. Go to your service → **Settings** → **Environment**
2. Update `CORS_ORIGIN` to your frontend URL (e.g., `https://your-netlify-site.netlify.app`)
3. Click **"Save Changes"**
4. Render will automatically redeploy

### Step 6: Verify Deployment

1. **Check build logs:**
   - Go to your service → **Logs**
   - Look for "Build successful" and "Starting service"

2. **Test the API:**
   ```bash
   curl https://your-app.onrender.com/api/health
   ```
   Should return: `{"status":"ok","message":"Proctor MVP API is running",...}`

3. **Check service status:**
   - Should show "Live" in green

## Important Configuration Notes

### Root Directory

Since your server is in the `server/` subdirectory, you **must** set:
- **Root Directory:** `server`

This tells Render where your `package.json` is located.

### Build Command

```
npm install && npm run build
```

This will:
1. Install dependencies (including TypeScript from devDependencies)
2. Run `postinstall` script which runs `npm run build`
3. Compile TypeScript to JavaScript in `dist/` folder

### Start Command

```
npm start
```

This runs `node dist/index.js` as defined in your `package.json`.

## Free Tier Limitations

⚠️ **Sleep Mode:** Your app will sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds (cold start)
- Subsequent requests are fast
- **Solution:** Use a free uptime monitor like UptimeRobot to ping your app every 5 minutes

⚠️ **Resource Limits:**
- 512MB RAM
- 0.1 CPU share
- Should be fine for your MVP

## Keeping Your App Awake (Optional)

To prevent sleep mode, you can use **UptimeRobot** (Free):

1. Sign up at https://uptimerobot.com/ (free account)
2. Add a monitor:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Proctor MVP Server
   - **URL:** `https://your-app.onrender.com/api/health`
   - **Monitoring Interval:** 5 minutes
3. Click "Create Monitor"
4. This will ping your app every 5 minutes to keep it awake

## Deployment Workflow

After initial setup:

1. **Push to GitHub** → Render automatically detects changes
2. **Auto-deploys** → Render builds and deploys automatically
3. **Check build logs** in Render dashboard
4. **Monitor** your app status

## Environment Variables Reference

Here's what you need to set in Render:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Server port (Render sets this automatically, but good to have) |
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB connection string |
| `JWT_SECRET` | `your-secret-32-chars+` | Secret for JWT tokens (min 32 chars) |
| `CORS_ORIGIN` | `https://your-frontend.netlify.app` | Allowed CORS origin |
| `CLIENT_BUILD_PATH` | `../client/dist/proctor-mvp` | Optional: if serving Angular from server |

**Generate JWT Secret:**
```bash
# Run locally
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Troubleshooting

### Build Fails: "Cannot find module 'typescript'"

**Solution:** 
- TypeScript is now in `devDependencies` ✅
- Render installs devDependencies during build
- If still fails, check build logs for exact error

### Build Fails: "Cannot find module"

**Solution:** 
- Ensure **Root Directory** is set to `server`
- Check that `package.json` exists in `server/` directory

### Build Fails: "Command 'tsc' not found"

**Solution:**
- Verify TypeScript is in `devDependencies` (already added ✅)
- Check build logs to see if `npm install` completed successfully

### App Crashes: "Cannot find dist/index.js"

**Check:**
- Build logs show `npm run build` completed successfully
- Verify `dist/` folder was created
- Check that build command includes `npm run build`

**Solution:** 
- Check build logs in Render dashboard
- Ensure TypeScript compiled without errors

### App Crashes: "MongoServerError"

**Check:**
- `MONGODB_URI` is set correctly in Render
- MongoDB Atlas IP whitelist includes `0.0.0.0/0` (all IPs)
- Connection string has correct username/password
- Database name is correct

**Solution:**
- Double-check MongoDB Atlas network access settings
- Verify connection string format

### Slow First Request

**This is normal!** Free tier apps sleep after inactivity. First request wakes them up (~30 seconds).

**Solution:** 
- Use UptimeRobot to keep it awake (see above)
- Or upgrade to paid plan ($7/month) for no sleep mode

### Socket.IO Connection Issues

**Check:**
- Backend URL is correct
- CORS settings allow your frontend domain
- WebSocket connections are supported (Render supports them ✅)

**Solution:**
- Verify `CORS_ORIGIN` includes your frontend URL
- Check Socket.IO configuration in your code

## Custom Domain (Optional)

1. Go to your service → **Settings** → **Custom Domains**
2. Add your domain (e.g., `api.yourdomain.com`)
3. Follow DNS configuration instructions
4. Render provides free SSL automatically

## Monitoring & Logs

- **Real-time Logs:** View in Render dashboard → Your service → **Logs**
- **Metrics:** Basic metrics available on free tier
- **Alerts:** Set up email alerts for deployment failures in Settings

## Cost

✅ **Free tier is completely free** (no credit card needed)
- 750 hours/month
- Enough for 24/7 operation
- Sleep mode after inactivity (can be prevented with UptimeRobot)

**Paid Plans:**
- **Starter:** $7/month - No sleep mode, better performance
- **Standard:** $25/month - More resources

## Next Steps

1. ✅ Deploy backend to Render (this guide)
2. ✅ Deploy frontend to Netlify (see NETLIFY_DEPLOYMENT.md)
3. ✅ Set `CORS_ORIGIN` in Render to your Netlify URL
4. ✅ Set `NETLIFY_API_URL` in Netlify to your Render URL
5. ✅ Test the full application

## Quick Reference Commands

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test API after deployment
curl https://your-app.onrender.com/api/health

# Check if app is awake
curl -I https://your-app.onrender.com/api/health
```

## Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com/
- Check logs in Render dashboard for detailed error messages
- Render Support: Available in dashboard

## Why Render?

✅ **Free tier** - Perfect for MVPs and side projects  
✅ **Easy deployment** - Automatic deployments from GitHub  
✅ **Free SSL** - HTTPS included  
✅ **WebSocket support** - Works great with Socket.IO  
✅ **No credit card required** - For free tier  

Perfect for your MVP! 🎉
