# Deployment Guide for Render 🚀

This guide will help you deploy the Telegram Job Scraper to Render.

## Prerequisites

1. **GitHub Account** - Your code needs to be on GitHub
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Session String** - You need to authenticate locally first (see below)

## Step 1: Get Your Session String Locally

⚠️ **IMPORTANT**: Render doesn't support interactive input, so you must get your session string locally first.

1. **Run the app locally:**
   ```bash
   npm install
   npm start
   ```

2. **Complete authentication:**
   - Enter your phone number when prompted
   - Enter the verification code you receive
   - If you have 2FA, enter your password

3. **Copy the session string:**
   - Look for this in the logs:
     ```
     ⚠️  IMPORTANT: Save this session string to your .env file:
     SESSION_STRING=1BVtsOMwBu4...
     ```
   - Copy the entire session string (it's very long)

4. **Save it** - You'll need it for Render environment variables

## Step 2: Prepare Your Code

1. **Make sure your code is on GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Verify these files exist:**
   - ✅ `package.json`
   - ✅ `index.js`
   - ✅ `render.yaml` (optional, but recommended)

## Step 3: Deploy to Render

### Method A: Using Render Dashboard (Recommended for beginners)

1. **Go to Render Dashboard:**
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Sign in or create an account

2. **Create New Web Service:**
   - Click "New +" button
   - Select "Web Service"
   - Connect your GitHub account if not already connected
   - Select your repository

3. **Configure the Service:**
   - **Name**: `telegram-job-scraper` (or your choice)
   - **Environment**: `Node`
   - **Region**: Choose closest to you
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (or `.` if needed)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: 
     - **Free**: Spins down after 15 min inactivity (not ideal for this app)
     - **Starter ($7/month)**: Always on, better for this use case

4. **Set Environment Variables:**
   Click "Advanced" → "Add Environment Variable" and add:
   
   ```
   API_ID=your_api_id_here
   API_HASH=your_api_hash_here
   SESSION_STRING=your_session_string_from_step_1
   BOT_TOKEN=your_bot_token_here
   SOURCE_CHANNEL=your_source_channel_username
   TARGET_CHANNEL=your_target_channel_or_chat_id
   JOB_KEYWORDS=developer,flutter,react,backend,frontend,software,engineer,programmer,coder,nodejs,python,javascript,typescript,fullstack,devops,ui,ux,designer,qa,test
   POLL_INTERVAL=30
   LOG_LEVEL=info
   NODE_ENV=production
   ```

5. **Create and Deploy:**
   - Click "Create Web Service"
   - Render will start building
   - Watch the logs for any errors
   - Once deployed, your app will be running!

### Method B: Using render.yaml (Infrastructure as Code)

1. **The `render.yaml` file is already in the project**

2. **In Render Dashboard:**
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will detect `render.yaml` automatically

3. **Set Environment Variables:**
   - Go to your service → "Environment" tab
   - Add the same variables as Method A
   - Note: `render.yaml` defines the structure, but you still need to set the actual values

4. **Deploy:**
   - Render will automatically deploy

## Step 4: Verify Deployment

1. **Check Logs:**
   - Go to your service in Render Dashboard
   - Click "Logs" tab
   - You should see:
     ```
     🚀 Initializing Telegram Job Scraper...
     ✅ All components initialized successfully
     🔄 Starting polling every 30 seconds...
     ```

2. **Test the Bot:**
   - Send a test message to your bot
   - Check if job posts are being forwarded

3. **Monitor:**
   - Check logs regularly for any errors
   - Monitor CPU/Memory usage in Render Dashboard

## Troubleshooting

### Issue: "AUTH_KEY_UNREGISTERED" Error

**Solution:**
- Your `SESSION_STRING` is missing or invalid
- Get a new session string locally and update it in Render

### Issue: "chat not found" Error

**Solution:**
- Verify `TARGET_CHANNEL` is correct
- Make sure bot is added to the channel as admin
- Use chat ID instead of username if needed

### Issue: App Keeps Restarting

**Solution:**
- Check logs for errors
- Verify all environment variables are set
- Free plan spins down after inactivity - upgrade to paid for 24/7

### Issue: Build Fails

**Solution:**
- Check build logs in Render
- Ensure `package.json` is correct
- Verify Node.js version compatibility

### Issue: Session Expired

**Solution:**
1. Run locally again: `npm start`
2. Re-authenticate if needed
3. Copy new `SESSION_STRING`
4. Update in Render → Environment Variables
5. Restart the service

## Updating Your Deployment

### Update Code:
```bash
git add .
git commit -m "Update code"
git push
```
Render will automatically redeploy.

### Update Environment Variables:
1. Go to Render Dashboard → Your Service → Environment
2. Edit variables
3. Save changes
4. Service will restart automatically

## Cost Considerations

- **Free Plan**: 
  - Spins down after 15 min inactivity
  - Not ideal for continuous monitoring
  - Good for testing

- **Starter Plan ($7/month)**:
  - Always on
  - 512 MB RAM
  - Better for production use

- **Professional Plan ($25/month)**:
  - More resources
  - Better performance
  - For high-volume usage

## Security Best Practices

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Use Render's environment variables** - Don't hardcode secrets
3. **Rotate session strings** - If compromised, regenerate
4. **Monitor logs** - Watch for suspicious activity

## Alternative: Deploy to Other Platforms

This app can also be deployed to:
- **Heroku**: Similar process, uses Procfile
- **Railway**: Simple deployment, good free tier
- **DigitalOcean App Platform**: Good performance
- **AWS/GCP/Azure**: More complex, but scalable

## Need Help?

- Check Render documentation: [render.com/docs](https://render.com/docs)
- Check application logs in Render Dashboard
- Verify all environment variables are correct
- Ensure bot has proper permissions

---

**Happy Deploying! 🚀**

