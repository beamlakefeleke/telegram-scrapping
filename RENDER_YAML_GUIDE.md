# Render.yaml Configuration Guide

This guide explains how to modify `render.yaml` for your deployment.

## File Structure Overview

```yaml
services:                    # List of services to deploy
  - type: web                # Service type (web, worker, etc.)
    name: telegram-job-scraper  # Your service name
    env: node                 # Runtime environment
    plan: free                # Pricing plan
    buildCommand: npm install  # Command to build
    startCommand: npm start    # Command to start
    envVars:                  # Environment variables
      - key: VARIABLE_NAME
        value: value          # OR sync: false (set in dashboard)
```

## What You Can Change

### 1. Service Name (Line 3)
```yaml
name: telegram-job-scraper
```
**Change to:** Your preferred service name
```yaml
name: my-job-bot
# or
name: freelance-job-scraper
```

### 2. Pricing Plan (Line 5)
```yaml
plan: free
```
**Options:**
- `free` - Free tier (spins down after 15 min inactivity)
- `starter` - $7/month (always on, 512MB RAM)
- `standard` - $25/month (more resources)
- `pro` - $85/month (high performance)

**Recommended for this app:**
```yaml
plan: starter  # Better for 24/7 monitoring
```

### 3. Build Command (Line 6)
```yaml
buildCommand: npm install
```
**Usually keep as is**, but you can customize:
```yaml
buildCommand: npm ci --production  # Faster, production-only
# or
buildCommand: npm install && npm run build  # If you have build step
```

### 4. Start Command (Line 7)
```yaml
startCommand: npm start
```
**Usually keep as is**, matches your `package.json` script.

### 5. Environment Variables

#### Variables with `sync: false` (Lines 11-22)
These are placeholders - you MUST set actual values in Render Dashboard:
```yaml
- key: API_ID
  sync: false  # Means: "Set this in Render Dashboard"
```

**You cannot set values here** - they must be set in Render Dashboard → Environment tab.

#### Variables with `value:` (Lines 9, 23-28)
These have default values you can modify:

**NODE_ENV:**
```yaml
- key: NODE_ENV
  value: production  # Change to 'development' if needed (not recommended)
```

**JOB_KEYWORDS:**
```yaml
- key: JOB_KEYWORDS
  value: developer,flutter,react,backend,frontend,software,engineer,programmer,coder,nodejs,python,javascript,typescript,fullstack,devops,ui,ux,designer,qa,test
```
**Customize your keywords:**
```yaml
- key: JOB_KEYWORDS
  value: developer,react,nodejs,python,javascript,typescript,backend,frontend
```

**POLL_INTERVAL:**
```yaml
- key: POLL_INTERVAL
  value: 30  # Seconds between checks
```
**Change polling frequency:**
```yaml
- key: POLL_INTERVAL
  value: 60  # Check every 60 seconds (less frequent)
# or
- key: POLL_INTERVAL
  value: 15  # Check every 15 seconds (more frequent, may hit rate limits)
```

**LOG_LEVEL:**
```yaml
- key: LOG_LEVEL
  value: info
```
**Options:**
```yaml
- key: LOG_LEVEL
  value: error   # Only errors
# or
- key: LOG_LEVEL
  value: debug   # Very verbose (for troubleshooting)
```

## Complete Customized Example

Here's a fully customized example:

```yaml
services:
  - type: web
    name: my-freelance-job-bot          # Changed name
    env: node
    plan: starter                        # Changed to paid plan
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: API_ID
        sync: false                      # Set in dashboard
      - key: API_HASH
        sync: false                      # Set in dashboard
      - key: SESSION_STRING
        sync: false                      # Set in dashboard
      - key: BOT_TOKEN
        sync: false                      # Set in dashboard
      - key: SOURCE_CHANNEL
        sync: false                      # Set in dashboard
      - key: TARGET_CHANNEL
        sync: false                      # Set in dashboard
      - key: JOB_KEYWORDS
        value: developer,react,nodejs,python,backend,frontend,fullstack  # Customized
      - key: POLL_INTERVAL
        value: 45                        # Check every 45 seconds
      - key: LOG_LEVEL
        value: warn                     # Only warnings and errors
```

## Important Notes

### ⚠️ Variables with `sync: false`
- These are **NOT set** in the YAML file
- You **MUST** set them in Render Dashboard → Environment tab
- The YAML just tells Render these variables are needed
- Never put secrets (API_ID, API_HASH, SESSION_STRING, BOT_TOKEN) directly in YAML

### ✅ Variables with `value:`
- These have default values
- You can override them in Render Dashboard if needed
- Safe to modify in the YAML file

### 🔒 Security
- Never commit secrets to the YAML file
- Always use `sync: false` for sensitive data
- Set secrets only in Render Dashboard

## Step-by-Step: How to Modify

1. **Open `render.yaml` in your editor**

2. **Change service name** (optional):
   ```yaml
   name: your-custom-name
   ```

3. **Change plan** (recommended):
   ```yaml
   plan: starter  # For always-on service
   ```

4. **Customize keywords**:
   ```yaml
   - key: JOB_KEYWORDS
     value: your,keywords,here
   ```

5. **Adjust poll interval**:
   ```yaml
   - key: POLL_INTERVAL
     value: 30  # Your preferred interval
   ```

6. **Save the file**

7. **Commit and push**:
   ```bash
   git add render.yaml
   git commit -m "Update render.yaml configuration"
   git push
   ```

8. **Set secrets in Render Dashboard**:
   - Go to your service → Environment tab
   - Add: API_ID, API_HASH, SESSION_STRING, BOT_TOKEN, SOURCE_CHANNEL, TARGET_CHANNEL

## Common Customizations

### For Faster Polling (More Frequent Checks)
```yaml
- key: POLL_INTERVAL
  value: 15  # Check every 15 seconds
```

### For Slower Polling (Less Frequent, Save Resources)
```yaml
- key: POLL_INTERVAL
  value: 60  # Check every minute
```

### For Minimal Logging
```yaml
- key: LOG_LEVEL
  value: error  # Only log errors
```

### For Debug Mode (Troubleshooting)
```yaml
- key: LOG_LEVEL
  value: debug  # Log everything
```

### For Specific Job Types Only
```yaml
- key: JOB_KEYWORDS
  value: react,nodejs,python,backend,frontend
```

## After Making Changes

1. **Save the file**
2. **Commit to Git:**
   ```bash
   git add render.yaml
   git commit -m "Updated render configuration"
   git push
   ```
3. **Render will auto-deploy** with new settings
4. **Check Render Dashboard** → Logs to verify it's working

---

**Need help?** Check Render logs if something doesn't work after changes.

