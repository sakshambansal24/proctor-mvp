# Netlify Deployment - Quick Start

## 🚀 Quick Deployment Steps

### 1. Deploy Backend First
Deploy your backend to Render or Railway and get the URL (e.g., `https://your-backend.onrender.com`)

### 2. Deploy to Netlify

#### Option A: Via Netlify Dashboard
1. Go to https://app.netlify.com/
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your Git repository
4. Configure:
   - **Build command:** `cd client && npm install && npm run build:prod`
   - **Publish directory:** `client/dist/proctor-mvp`
5. Add environment variable:
   - **Key:** `NETLIFY_API_URL`
   - **Value:** `https://your-backend.onrender.com` (your backend URL, NO `/api` suffix)
6. Click **"Deploy site"**

#### Option B: Via Netlify CLI
```bash
# Install CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd /path/to/proctor-mvp
netlify init
netlify env:set NETLIFY_API_URL https://your-backend.onrender.com
netlify deploy --prod
```

### 3. Update Backend CORS
After getting your Netlify URL, update backend environment variable:
```env
CORS_ORIGIN=https://your-site.netlify.app
```

### 4. Test
Visit your Netlify site and test the application!

## 📝 Important Notes

- **Backend URL:** Set `NETLIFY_API_URL` to your backend URL WITHOUT the `/api` suffix
- **CORS:** Make sure backend allows your Netlify domain
- **Socket.IO:** Requires persistent server (not serverless)

## 🔧 Troubleshooting

- **Build fails?** Check build logs in Netlify dashboard
- **API calls fail?** Verify `NETLIFY_API_URL` is set correctly
- **404 on refresh?** Check `netlify.toml` redirects are working

For detailed instructions, see [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md)
