# 🚀 Deploy to Vercel - Free Hosting Guide

## Quick Deploy (Recommended)

### Option 1: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/repo-pulse)

1. Click the button above
2. Connect your GitHub account
3. Vercel will automatically detect the Django project
4. Click "Deploy"
5. Your app will be live in minutes!

### Option 2: Manual Deploy

#### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Deploy
```bash
vercel --prod
```

## Environment Variables Setup

### Required Variables
Set these in your Vercel dashboard:

1. Go to your project dashboard
2. Click "Settings" → "Environment Variables"
3. Add the following:

```
SECRET_KEY=your-super-secret-key-here
DEBUG=False
GITHUB_TOKEN=your-github-token-here (optional)
```

### How to Get GitHub Token (Optional)
1. Go to https://github.com/settings/tokens
2. Click "Generate new token"
3. Select scopes: `public_repo`, `read:user`
4. Copy the token to Vercel environment variables

## Automatic Deployment with GitHub

### Step 1: Get Vercel Tokens
1. Go to https://vercel.com/account/tokens
2. Create a new token
3. Copy the token

### Step 2: Get Project Info
```bash
vercel ls
```
Note down:
- `ORG_ID` (your organization ID)
- `PROJECT_ID` (your project ID)

### Step 3: Add GitHub Secrets
1. Go to your GitHub repository
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Add these secrets:
   - `VERCEL_TOKEN` = Your Vercel token
   - `ORG_ID` = Your organization ID
   - `PROJECT_ID` = Your project ID

### Step 4: Push to Deploy
Now every push to `main` branch will automatically deploy to Vercel!

## Custom Domain (Optional)

1. Go to your Vercel dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS settings as instructed

## Troubleshooting

### Build Errors
```bash
# Check build logs
vercel logs

# Redeploy
vercel --prod
```

### Static Files Not Loading
- Make sure `whitenoise` is in requirements.txt
- Check that `STATICFILES_STORAGE` is set correctly

### Environment Variables Not Working
- Make sure variables are set in Vercel dashboard
- Redeploy after adding variables

### GitHub API Rate Limits
- Add your GitHub token to environment variables
- This increases rate limits from 60 to 5000 requests/hour

## Vercel Features You Get

✅ **Free Hosting** - No cost for personal projects  
✅ **Automatic HTTPS** - SSL certificates included  
✅ **Global CDN** - Fast loading worldwide  
✅ **Automatic Deployments** - Deploy on every push  
✅ **Custom Domains** - Use your own domain  
✅ **Analytics** - Track usage and performance  
✅ **Edge Functions** - Serverless functions  
✅ **Preview Deployments** - Test before going live  

## Performance Tips

1. **Enable Caching**
   - Vercel automatically caches static files
   - API responses are cached for better performance

2. **Optimize Images**
   - Use WebP format when possible
   - Compress images before uploading

3. **Minimize Dependencies**
   - Only include necessary packages
   - Use lightweight alternatives when possible

## Monitoring

### Vercel Analytics
- Go to your project dashboard
- Click "Analytics" tab
- Monitor performance and usage

### Function Logs
```bash
vercel logs
```

### Real-time Monitoring
- Vercel provides real-time function execution logs
- Monitor API calls and response times

## Cost Breakdown

### Free Tier Includes:
- 100GB bandwidth/month
- 100GB storage
- 100GB function execution time
- Unlimited personal projects
- Custom domains
- Automatic deployments

### When You Need to Upgrade:
- More than 100GB bandwidth
- Team collaboration features
- Advanced analytics
- Priority support

## Support

- **Vercel Documentation**: https://vercel.com/docs
- **Django on Vercel**: https://vercel.com/docs/functions/serverless-functions/runtimes/python
- **Community**: https://github.com/vercel/vercel/discussions

---

**Your RepoPulse will be live at: `https://your-project-name.vercel.app`** 