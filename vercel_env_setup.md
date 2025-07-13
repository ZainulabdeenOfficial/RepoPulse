# Vercel Environment Variables Setup

## Step 1: Go to Vercel Dashboard
1. Visit https://vercel.com/dashboard
2. Click on your RepoPulse project

## Step 2: Add Environment Variables
1. Click **Settings** → **Environment Variables**
2. Add these variables:

### Required Variables:
```
SECRET_KEY=your-super-secret-key-here
DEBUG=False
```

### Optional Variables (for better GitHub API access):
```
GITHUB_TOKEN=your-github-token-here
```

## Step 3: Generate Secret Key
If you don't have a secret key, generate one:
```python
import secrets
print(secrets.token_urlsafe(50))
```

## Step 4: Get GitHub Token (Optional)
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - `public_repo`
   - `read:user`
4. Copy the token to Vercel environment variables

## Step 5: Redeploy
After adding environment variables:
1. Go to your project dashboard
2. Click "Deployments"
3. Click "Redeploy" on the latest deployment

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | Django secret key for security |
| `DEBUG` | Yes | Set to `False` for production |
| `GITHUB_TOKEN` | No | GitHub API token for higher rate limits |
| `ALLOWED_HOSTS` | No | Comma-separated list of allowed hosts | 

---

**Would you like me to update your `vercel.json` and check your folder structure for you?**