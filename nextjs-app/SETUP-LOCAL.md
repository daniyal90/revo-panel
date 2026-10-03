# Local Setup Guide - Limax SMS Monetization Platform

## Prerequisites
- Node.js 18+ installed ([Download here](https://nodejs.org/))
- Git installed ([Download here](https://git-scm.com/downloads))
- A code editor (VS Code recommended)

---

## Step 1: Navigate to Project Directory

```powershell
cd "c:\Users\Hani\Desktop\Limax new\nextjs-app"
```

---

## Step 2: Install Dependencies

```powershell
npm install
```

This will install all packages listed in `package.json`:
- next@14.2.5
- react@18.3.1
- @prisma/client@5.18.0
- framer-motion@11.3.19
- lucide-react@0.424.0
- tailwindcss@3.4.9
- And all other dependencies

**Expected output:** Packages will be downloaded and installed. This may take 2-5 minutes.

---

## Step 3: Create Environment Variables File

```powershell
Copy-Item .env.example .env
```

Or manually create `.env` file in the project root with:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/limax_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-a-random-string"
```

**Generate a secure NEXTAUTH_SECRET:**
```powershell
# PowerShell
openssl rand -base64 32
# Or use this online tool: https://generate-secret.vercel.app/32
```

---

## Step 4: Set Up PostgreSQL Database

### Option A: Local PostgreSQL (Recommended for Development)

1. **Install PostgreSQL for Windows:**
   - Download from: https://www.postgresql.org/download/windows/
   - Install with default settings
   - Remember your password (default user: `postgres`)

2. **Create Database:**
   ```powershell
   # Open pgAdmin or use psql command line
   psql -U postgres
   ```
   Then run:
   ```sql
   CREATE DATABASE limax_db;
   \q
   ```

3. **Update DATABASE_URL in .env:**
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/limax_db"
   ```

### Option B: Cloud Database (Neon.tech - Free)

See `SETUP-CLOUD-DB.md` for detailed instructions.

---

## Step 5: Initialize Prisma

```powershell
npx prisma generate
```

This generates the Prisma Client based on your schema.

**Expected output:**
```
✔ Generated Prisma Client
```

---

## Step 6: Push Database Schema

```powershell
npx prisma db push
```

This creates all tables in your database based on `prisma/schema.prisma`.

**Expected output:**
```
✔ Introspected 5 models and created 5 tables in your database
```

---

## Step 7: Start Development Server

```powershell
npm run dev
```

**Expected output:**
```
  ▲ Next.js 14.2.5
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in 2.5s
```

---

## Step 8: Open in Browser

Open Google Chrome and navigate to:
```
http://localhost:3000
```

You should see the Limax landing page with:
- Hero section with live UTC clock
- Live traffic monitor
- 4-step process section
- Value proposition grid
- FAQ accordion
- Contact section

---

## Troubleshooting

### Error: "Cannot find module 'react'"
**Solution:** Run `npm install` again to ensure all dependencies are installed.

### Error: "Database connection failed"
**Solution:**
1. Verify PostgreSQL is running
2. Check DATABASE_URL in `.env` matches your database credentials
3. Test connection: `npx prisma db pull`

### Error: "Port 3000 is already in use"
**Solution:** Kill the process or use a different port:
```powershell
# Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### TypeScript Errors in IDE
**Solution:** These are expected before `npm install`. After installing dependencies, restart your IDE.

---

## Quick Start Script (One-Command Setup)

Save this as `setup.ps1` in the project root and run it:

```powershell
# setup.ps1
Write-Host "🚀 Setting up Limax SMS Monetization Platform..." -ForegroundColor Green

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Create .env file
Write-Host "🔧 Creating .env file..." -ForegroundColor Yellow
if (!(Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "✅ .env file created. Please update DATABASE_URL and NEXTAUTH_SECRET." -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file already exists." -ForegroundColor Yellow
}

# Generate Prisma Client
Write-Host "🗄️  Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

# Push database schema
Write-Host "📊 Pushing database schema..." -ForegroundColor Yellow
npx prisma db push

Write-Host "✅ Setup complete! Run 'npm run dev' to start the server." -ForegroundColor Green
```

Run it:
```powershell
powershell -ExecutionPolicy Bypass -File setup.ps1
```

---

## Next Steps

1. Test the landing page at `http://localhost:3000`
2. Set up cloud database (see `SETUP-CLOUD-DB.md`)
3. Deploy to Vercel (see `DEPLOY-VERCEL.md`)
4. Test API routes in Chrome (see `TESTING-CHROME.md`)
