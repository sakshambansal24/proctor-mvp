# Netlify Deployment Guide

This guide explains how to deploy the Proctor MVP frontend to Netlify.

## Important Note

**This project has two parts:**
1. **Frontend (Angular)** - Can be deployed to Netlify ✅
2. **Backend (Node.js/Express/Socket.IO)** - Needs a separate hosting service (Render, Railway, AWS, etc.) ⚠️

Netlify is great for static sites and frontends, but Socket.IO requires a persistent server connection, so the backend must be deployed separately.

## Prerequisites

1. A Netlify account (sign up at https://app.netlify.com/)
2. Your backend deployed and accessible via a public URL
3. Git repository (GitHub, GitLab, or Bitbucket) connected to your project

## Step 1: Deploy Backend First

Before deploying the frontend, you need to deploy your backend server. Here are recommended options:

### Option A: Render (Recommended - Free Tier Available)
1. Go to https://render.com/
2. Create a new Web Service
3. Connect your repository
4. Set root directory: `server`
5. Set build command: `npm install && npm run build`
6. Set start command: `npm start`
7. Add MongoDB service or use MongoDB Atlas
8. Set environment variables
9. See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for detailed instructions

### Option B: Railway
1. Go to https://railway.app/
2. Create a new project
3. Connect your repository
4. Add MongoDB service or use MongoDB Atlas
5. Set environment variables
6. Deploy

**Important:** Note your backend URL (e.g., `https://your-backend.onrender.com`)

## Step 2: Configure Environment Variables

In your backend deployment, set these environment variables:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secure-jwt-secret-min-32-chars
CORS_ORIGIN=https://your-netlify-site.netlify.app
```

**Note:** Update `CORS_ORIGIN` after you get your Netlify URL.

## Step 3: Deploy Frontend to Netlify

### Method 1: Netlify Dashboard (Recommended for first deployment)

1. **Go to Netlify Dashboard**
   - Visit https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"

2. **Connect Repository**
   - Connect your Git provider (GitHub, GitLab, Bitbucket)
   - Select your repository
   - Select the branch (usually `main` or `master`)

3. **Configure Build Settings**
   - **Base directory:** Leave empty (or `./` if needed)
   - **Build command:** `cd client && npm install && npm run build:prod`
   - **Publish directory:** `client/dist/proctor-mvp`

4. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Add the following:
     - **Key:** `NETLIFY_API_URL`
     - **Value:** Your backend URL (e.g., `https://your-backend.railway.app`)
     - **Important:** Do NOT include `/api` suffix, the script will add it

5. **Deploy**
   - Click "Deploy site"
   - Wait for the build to complete

### Method 2: Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize Site**
   ```bash
   cd /path/to/proctor-mvp
   netlify init
   ```
   - Follow the prompts
   - Select "Create & configure a new site"
   - Choose your team
   - Site name (or leave blank for auto-generated)

4. **Set Environment Variable**
   ```bash
   netlify env:set NETLIFY_API_URL https://your-backend.railway.app
   ```

5. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## Step 4: Update CORS Settings

After deployment, update your backend's `CORS_ORIGIN` environment variable to include your Netlify URL:

```env
CORS_ORIGIN=https://your-site.netlify.app
```

Restart your backend server.

## Step 5: Test Deployment

1. Visit your Netlify site URL
2. Test the application:
   - Try logging in
   - Create a test
   - Check if API calls work
   - Verify Socket.IO connections

## Troubleshooting

### Build Fails

- **Check build logs** in Netlify dashboard
- **Verify Node version:** Netlify uses Node 18 by default (should be fine)
- **Check environment variables** are set correctly

### API Calls Fail

- **Check CORS settings** in backend
- **Verify `NETLIFY_API_URL`** is set correctly (without `/api` suffix)
- **Check browser console** for errors
- **Verify backend is running** and accessible

### Socket.IO Connection Fails

- **Check backend URL** is correct
- **Verify CORS** allows your Netlify domain
- **Check Socket.IO configuration** in backend
- **Ensure backend supports WebSocket** connections

### Routing Issues (404 on refresh)

- The `netlify.toml` file should handle this
- If not, check that `_redirects` file is in `src/assets/`
- Verify redirect rules in Netlify dashboard

### Environment Variable Not Working

- **Check variable name:** Must be `NETLIFY_API_URL`
- **Redeploy** after changing environment variables
- **Check build logs** to see if script ran successfully

## File Structure

The following files are important for Netlify deployment:

```
proctor-mvp/
├── netlify.toml              # Netlify configuration
├── client/
│   ├── src/
│   │   ├── assets/
│   │   │   └── _redirects   # SPA routing redirects
│   │   └── environments/
│   │       └── environment.prod.ts  # Production environment
│   └── scripts/
│       └── set-env.js        # Build-time environment variable injection
```

## Continuous Deployment

Once connected to Git, Netlify will automatically deploy when you push to your main branch. You can:

- Set up branch previews for pull requests
- Configure deploy contexts for different branches
- Set up build hooks for manual deployments

## Custom Domain

To use a custom domain:

1. Go to Site settings → Domain management
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `CORS_ORIGIN` in backend to include your custom domain

## Monitoring

- **Netlify Analytics:** View site traffic and performance
- **Function logs:** Check serverless function logs (if using)
- **Deploy logs:** Review build and deploy logs

## Next Steps

After successful deployment:

1. Set up monitoring and alerts
2. Configure custom domain (if needed)
3. Set up CI/CD workflows
4. Configure backup and disaster recovery for backend
5. Set up MongoDB backups

## Support

For issues:
- Check Netlify documentation: https://docs.netlify.com/
- Check build logs in Netlify dashboard
- Review backend logs
- Check browser console for frontend errors
