# Render Deployment Troubleshooting

Common issues and solutions when deploying to Render.

## ✅ Your Backend is Live!

Your backend is successfully deployed at: `https://uw-tracker.onrender.com`

The 404 on root endpoint (`/`) is normal and has been fixed. Here's what you need to know:

## Common Issues

### 1. Root Endpoint Returns 404

**Issue**: `GET /` returns 404 Not Found

**Status**: ✅ Fixed - Root endpoint added to server.py

**What was added:**
```python
@app.get("/")
async def root():
    return {
        "message": "UW Tracker API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/healthz",
        "info": "/api/info"
    }
```

After pushing, Render will auto-deploy and `/` will work.

**Test endpoints:**
- `https://uw-tracker.onrender.com/` - Root (after fix)
- `https://uw-tracker.onrender.com/api/healthz` - Health check ✅
- `https://uw-tracker.onrender.com/api/info` - API info ✅
- `https://uw-tracker.onrender.com/docs` - API documentation ✅

### 2. Database Connection Issues

**Symptoms:**
- Health check returns `"database": "disconnected"`
- API endpoints fail with database errors

**Solutions:**
1. **Check MongoDB Atlas IP Whitelist:**
   - Go to MongoDB Atlas → Network Access
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for Render)

2. **Verify Connection String:**
   - Check `MONGODB_URL` in Render environment variables
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/uw_tracker`
   - Ensure password is URL-encoded if special characters exist

3. **Check Database User:**
   - Verify user has read/write permissions
   - Check username and password are correct

### 3. Build Failures

**Symptoms:**
- Service shows "Build failed"
- Check logs for error messages

**Common Causes:**

**Missing Dependencies:**
```
ERROR: Could not find a version that satisfies the requirement
```
→ Check `requirements.txt` has all dependencies listed

**Python Version Issues:**
```
Python version not found
```
→ Set `PYTHON_VERSION=3.13.0` in environment variables, or update runtime.txt

**Module Import Errors:**
```
ModuleNotFoundError: No module named 'xxx'
```
→ Add missing dependency to `requirements.txt`

### 4. Application Won't Start

**Symptoms:**
- Service shows "Unhealthy"
- Logs show import errors

**Solutions:**
1. **Check Start Command:**
   ```
   uvicorn server:app --host 0.0.0.0 --port $PORT
   ```
   Must use `0.0.0.0` (not `localhost`) and `$PORT`

2. **Check Root Directory:**
   - Must be set to `backend`
   - Verify `server.py` exists in backend directory

3. **Check Import Paths:**
   - All imports must be relative to backend directory
   - Verify `routers` and `services` modules exist

### 5. Cold Start Issues (Free Tier)

**Symptoms:**
- First request takes 30+ seconds
- Subsequent requests are fast

**Explanation:**
Render free tier spins down after 15 minutes of inactivity. First request after spin-down triggers a cold start.

**Solutions:**
- **Accept it**: Normal for free tier
- **Upgrade**: Starter plan ($7/mo) keeps service always-on
- **Keep Warm**: Use external ping service (e.g., UptimeRobot) to ping `/api/healthz` every 10 minutes

### 6. CORS Errors from Frontend

**Symptoms:**
- Frontend can't connect to backend
- Browser console shows CORS errors

**Solutions:**
1. **Update CORS in server.py:**
   ```python
   allow_origins=[
       "http://localhost:3000",
       "https://your-frontend.vercel.app",  # Your actual URL
       "https://uw-tracker.vercel.app",
   ]
   allow_origin_regex=r"https://.*\.vercel\.app",
   ```

2. **Redeploy:**
   - Commit and push changes
   - Render auto-deploys

### 7. Environment Variables Not Working

**Symptoms:**
- Application can't find environment variables
- Connection fails

**Solutions:**
1. **Check in Render Dashboard:**
   - Go to your service → Environment
   - Verify all variables are set
   - Check for typos in variable names

2. **Important Variables:**
   ```
   MONGODB_URL=mongodb+srv://...
   DATABASE_NAME=uw_tracker
   ```

3. **Restart Service:**
   - After adding/changing variables, service auto-restarts
   - Or manually click "Manual Deploy" → "Deploy latest commit"

### 8. Logs Show Errors But Service Works

**Symptoms:**
- Service is live and responding
- Logs show warnings/errors

**Check:**
- Non-critical errors (like startup warnings) are often OK
- Test actual endpoints: `/api/healthz`, `/api/info`
- If endpoints work, errors may be non-fatal

## Testing Your Deployment

### Quick Health Check

```bash
# Health check
curl https://uw-tracker.onrender.com/api/healthz

# API info
curl https://uw-tracker.onrender.com/api/info

# Test grouped records endpoint
curl "https://uw-tracker.onrender.com/api/uw-data-grouped/grouped?limit=5"
```

### Expected Responses

**Health Check:**
```json
{"status":"ok","database":"connected"}
```

**API Info:**
```json
{
  "name": "UW Tracker API",
  "version": "1.0.0",
  "description": "Indonesian IPO Underwriter Performance Tracker",
  "status": "running"
}
```

## Render Dashboard Tips

### View Logs
1. Click on your service
2. Go to **Logs** tab
3. See real-time application logs
4. Filter by search terms

### Check Metrics
1. Go to **Metrics** tab
2. View CPU, Memory, Network usage
3. Monitor request count
4. Check response times

### Manual Deploy
1. Go to **Manual Deploy**
2. Click **Deploy latest commit**
3. Useful for restarting service or redeploying after env var changes

### Environment Variables
1. Go to **Environment** tab
2. Add/edit variables
3. Service auto-restarts after changes
4. Never commit secrets to git!

## Next Steps After Successful Deployment

1. ✅ **Update CORS** with your frontend URL
2. ✅ **Test all endpoints** from frontend
3. ✅ **Set up monitoring** (optional)
4. ✅ **Configure custom domain** (optional)
5. ✅ **Consider upgrading** if cold starts are an issue

## Getting Help

1. Check Render logs for specific error messages
2. Test endpoints directly with curl
3. Verify environment variables are set
4. Check MongoDB Atlas connection
5. Review this troubleshooting guide

---

**Your service is live at**: `https://uw-tracker.onrender.com`

All API endpoints should be accessible at `/api/*` paths!

