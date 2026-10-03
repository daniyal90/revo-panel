# Vercel Deployment Guide - Revo Panel SMS Monetization Platform

This guide will help you deploy your Next.js 14 application to Vercel for free with a custom domain.

---

## Prerequisites

- GitHub account ([Sign up here](https://github.com/signup))
- Vercel account ([Sign up here](https://vercel.com/signup))
- Cloud PostgreSQL database (Neon.tech, Supabase, or Railway)
- Project code ready locally

---

## Step 1: Initialize Git Repository

```powershell
cd "c:\Users\Hani\Desktop\Revo Panel new\nextjs-app"
git init
```

---

## Step 2: Create .gitignore (if not exists)

The project already has `.gitignore`, but verify it includes:

```gitignore
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# prisma
/prisma/migrations
```

---

## Step 3: Stage and Commit Files

```powershell
git add .
git commit -m "Initial commit: Limax SMS Monetization Platform"
```

---

## Step 4: Create GitHub Repository

### Option A: Using GitHub CLI (Faster)

```powershell
# Install GitHub CLI if not installed
winget install GitHub.cli

# Login to GitHub
gh auth login

# Create repository and push
gh repo create limax-sms-platform --public --source=. --remote=origin
git push -u origin main
```

### Option B: Using GitHub Website (Manual)

1. Go to: https://github.com/new
2. **Repository name:** `limax-sms-platform`
3. **Visibility:** Public (or Private)
4. **Initialize with README:** Unchecked (we already have one)
5. Click "Create repository"

6. Copy the commands shown by GitHub and run:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/limax-sms-platform.git
git branch -M main
git push -u origin main
```

---

## Step 5: Connect Vercel to GitHub

1. Go to: https://vercel.com
2. Click "Sign Up" or "Login"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub repositories
5. Click "Allow" for repository access

---

## Step 6: Import Project to Vercel

1. On Vercel dashboard, click "Add New..." → "Project"
2. You'll see your `limax-sms-platform` repository
3. Click "Import"

---

## Step 7: Configure Project Settings

### Framework Preset

Vercel will auto-detect "Next.js"

- **Framework Preset:** Next.js
- **Root Directory:** `./` (leave as is)
- **Build Command:** `npm run build` (auto-detected)
- **Output Directory:** `.next` (auto-detected)

### Environment Variables

Click "Environment Variables" and add:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | Your cloud database URL | Production, Preview, Development |
| `NEXTAUTH_URL` | Your Vercel domain (e.g., `https://limax-sms-platform.vercel.app`) | Production, Preview, Development |
| `NEXTAUTH_SECRET` | Generate a random secret | Production, Preview, Development |

**Generate NEXTAUTH_SECRET:**
```powershell
openssl rand -base64 32
# Or use: https://generate-secret.vercel.app/32
```

**For NEXTAUTH_URL:**
- Leave blank for now (Vercel will auto-fill after first deploy)
- Or use your custom domain if you have one

---

## Step 8: Deploy

1. Click "Deploy"
2. Vercel will build and deploy your application
3. Wait 2-5 minutes for the build to complete

**Expected output:**
```
✅ Production: https://limax-sms-platform.vercel.app [in 2m 30s]
```

---

## Step 9: Update NEXTAUTH_URL (if needed)

After first deployment:

1. Go to Vercel dashboard → Your project → Settings
2. Click "Environment Variables"
3. Update `NEXTAUTH_URL` to your actual domain:
   ```
   https://limax-sms-platform.vercel.app
   ```
4. Click "Save"
5. Redeploy: Click "Deployments" → "..." → "Redeploy"

---

## Step 10: Verify Deployment

Open your browser and navigate to:
```
https://limax-sms-platform.vercel.app
```

You should see the same landing page as locally.

---

## Step 11: Set Up Custom Domain (Optional)

### Option A: Use Vercel's Free Domain

Your app is already live at: `https://limax-sms-platform.vercel.app`

### Option B: Use Your Own Domain

1. Go to Vercel dashboard → Your project → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `limax.org`)
4. Click "Add"

Vercel will show DNS records to add to your domain registrar:

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

5. Add these records to your domain registrar (GoDaddy, Namecheap, etc.)
6. Wait 24-48 hours for DNS propagation
7. Vercel will automatically issue SSL certificate

---

## Step 12: Set Up Database for Production

Your cloud database (Neon/Supabase) is already configured for production.

**Important:** Ensure your `DATABASE_URL` in Vercel environment variables matches your cloud database connection string.

---

## Automatic Deployments

Vercel automatically deploys when:
- You push to `main` branch → Production
- You push to other branches → Preview deployments
- You create a Pull Request → Preview deployment

---

## Environment Variables Reference

### Development (Local)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/limax_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="local-secret"
```

### Production (Vercel)
```env
DATABASE_URL="postgresql://user:password@ep-xyz.aws.neon.tech/limax_db?sslmode=require"
NEXTAUTH_URL="https://limax-sms-platform.vercel.app"
NEXTAUTH_SECRET="production-secret"
```

---

## Monitoring and Logs

### View Deployment Logs

1. Go to Vercel dashboard → Your project → Deployments
2. Click on a deployment
3. View build logs, server logs, and function logs

### Real-time Logs

```powershell
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# View logs
vercel logs
```

---

## Troubleshooting

### Error: "Build failed"

**Solution:**
1. Check build logs for specific errors
2. Ensure all dependencies are in `package.json`
3. Verify TypeScript errors are resolved locally first

### Error: "Database connection failed"

**Solution:**
1. Verify `DATABASE_URL` in Vercel environment variables
2. Ensure cloud database is active (not suspended)
3. Check if SSL is enabled (`?sslmode=require`)

### Error: "NEXTAUTH_URL mismatch"

**Solution:**
1. Ensure `NEXTAUTH_URL` matches your actual domain
2. Include protocol (https://)
3. No trailing slash

### Error: "Port already in use" (local only)

**Solution:**
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Performance Optimization

Vercel automatically optimizes:
- Image optimization
- Static generation
- Edge caching
- CDN distribution

### Enable ISR (Incremental Static Regeneration)

Add to `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Enable ISR for better performance
  output: 'standalone',
};

module.exports = nextConfig;
```

---

## Scaling

Vercel Free Tier includes:
- ✅ 100GB bandwidth per month
- ✅ 6,000 minutes of execution time
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN

For higher limits, upgrade to Pro ($20/month).

---

## Security Best Practices

1. **Environment Variables:** Never commit `.env` to Git
2. **API Keys:** Store in Vercel environment variables
3. **HTTPS:** Vercel automatically enables HTTPS
4. **Rate Limiting:** Implement API rate limiting in your app
5. **Authentication:** Use NextAuth.js for secure auth

---

## Continuous Deployment Workflow

```powershell
# Make changes locally
git add .
git commit -m "Add new feature"
git push

# Vercel automatically deploys
# Check: https://vercel.com/your-username/limax-sms-platform/deployments
```

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Set up custom domain (optional)
3. ✅ Configure environment variables
4. ✅ Test production deployment
5. ✅ Set up monitoring (Vercel Analytics)
6. ✅ Test in Chrome (see `TESTING-CHROME.md`)

---

## Quick Reference Commands

```powershell
# Local development
npm run dev

# Build for production
npm run build

# Start production server locally
npm start

# Deploy to Vercel
vercel --prod

# View logs
vercel logs

# Pull environment variables
vercel env pull .env
```

---

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
