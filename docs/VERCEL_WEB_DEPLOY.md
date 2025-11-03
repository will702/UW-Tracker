# Deploying Frontend via Vercel Web Dashboard (GitHub Import)

Step-by-step guide for deploying the frontend using Vercel's web interface with GitHub integration.

## Prerequisites

1. ✅ GitHub repository pushed (all code committed)
2. ✅ Backend deployed on Render (get your backend URL)
3. ✅ Vercel account: [Sign up](https://vercel.com)

## Step 1: Import Project from GitHub

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Click **Import Git Repository**
4. Select your GitHub repository (`UW-Tracker` or your repo name)
5. Click **Import**

## Step 2: Configure Project Settings

**IMPORTANT:** These settings are critical for the build to work:

### Framework Preset
- **Framework Preset**: `Vite` (or select **Other**)

### Root Directory
- **Root Directory**: Click **Edit** → Select `frontend`
- This tells Vercel to build from the `frontend/` directory

### Build Settings
Vercel should auto-detect these from `frontend/vercel.json`, but verify:

- **Build Command**: `npm run build` (runs in `frontend/` directory)
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Environment Variables

Click **Environment Variables** and add:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_API_BASE_URL` | `https://uw-tracker.onrender.com/api` | Production, Preview, Development |

**Important:**
- Replace `uw-tracker.onrender.com` with your actual Render backend URL
- Include `/api` at the end
- No trailing slash

## Step 3: Deploy

1. Click **Deploy**
2. Wait for deployment (~2-3 minutes)
3. Vercel will show build logs in real-time
4. Once complete, you'll get a URL like: `https://uw-tracker.vercel.app`

## Step 4: Verify Deployment

1. Open your Vercel URL
2. Check browser console for errors
3. Test API connections:
   - Dashboard should load statistics
   - Records page should show data
   - Admin dashboard should work (login: `admin` / `admin123`)

## Troubleshooting

### Error: "Could not resolve entry module index.html"

**Solution:** Make sure Root Directory is set to `frontend` in Vercel project settings.

1. Go to Project Settings → General
2. Under **Root Directory**, select `frontend`
3. Redeploy

### Error: "Build failed" or TypeScript errors

**Solution:** Make sure you've pushed the latest commits:
```bash
git add .
git commit -m "Fix build configuration"
git push origin main
```
Then trigger a redeploy in Vercel.

### API calls failing (CORS errors)

**Solution:** Update backend CORS settings to include your Vercel URL:

1. In `backend/server.py`, add your Vercel domain to `allowed_origins`:
```python
origins = [
    "http://localhost:3000",
    "https://uw-tracker.vercel.app",  # Add your Vercel URL
    "https://*.vercel.app",  # Or use wildcard for preview deployments
]
```

2. Redeploy backend on Render

### Environment Variable Not Working

**Solution:** 
1. Verify variable name is exactly `VITE_API_BASE_URL` (case-sensitive)
2. Verify value includes `/api` at the end
3. Redeploy after adding/changing variables
4. Check build logs to see if variable is being used

## Project Settings Summary

When importing from GitHub, use these settings:

```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

## Auto-Deploy on Git Push

After initial deployment:
- Vercel automatically redeploys on every push to `main` branch
- Preview deployments are created for pull requests
- Production deployments require push to `main`

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS setup instructions
4. Vercel handles SSL automatically

## Next Steps

1. ✅ Update backend CORS with Vercel URL
2. ✅ Test all features
3. ✅ Share your live URL!

---

**Your app will be live at**: `https://your-project.vercel.app`

