# Get Vercel Project Information

## Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

## Step 2: Login to Vercel
```bash
vercel login
```

## Step 3: Get Project Information
```bash
vercel ls
```

This will show you:
- `ORG_ID` (your organization ID)
- `PROJECT_ID` (your project ID)

## Step 4: Add to GitHub Secrets
1. Go to https://github.com/ZainulabdeenOfficial/RepoPulse/settings/secrets/actions
2. Add these secrets:
   - `VERCEL_TOKEN` = Your Vercel token
   - `ORG_ID` = Your organization ID
   - `PROJECT_ID` = Your project ID

## Alternative: Get Info from Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to Settings → General
4. You'll find:
   - Project ID in the "Project ID" field
   - Team ID (this is your ORG_ID) 