# Cloud PostgreSQL Database Setup Guide

## Option 1: Neon.tech (Recommended - Free Tier)

Neon.tech offers a generous free tier with automatic scaling.

### Step 1: Create Neon Account

1. Go to: https://neon.tech
2. Click "Sign Up" (use GitHub, Google, or email)
3. Verify your email address

### Step 2: Create New Project

1. After logging in, click "Create a project"
2. **Project Name:** Enter `limax-sms-platform`
3. **Region:** Choose the closest region to your users (e.g., US East, EU West)
4. **PostgreSQL Version:** Leave as default (15+)
5. Click "Create project"

### Step 3: Get Connection String

1. Neon will show you a dashboard with your project
2. Look for the **Connection Details** section
3. Copy the **Connection string** (it looks like):
   ```
   postgresql://username:password@ep-xyz.aws.neon.tech/limax_sms_platform?sslmode=require
   ```

### Step 4: Update .env File

Open your `.env` file and replace `DATABASE_URL` with your Neon connection string:

```env
DATABASE_URL="postgresql://username:password@ep-xyz.aws.neon.tech/limax_sms_platform?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

**Important:** Keep the `?sslmode=require` parameter at the end for secure connections.

### Step 5: Test Connection

```powershell
cd "c:\Users\Hani\Desktop\Limax new\nextjs-app"
npx prisma db push
```

If successful, you'll see:
```
✔ Introspected 5 models and created 5 tables in your database
```

---

## Option 2: Supabase (Alternative - Free Tier)

Supabase is another excellent free PostgreSQL option with additional features.

### Step 1: Create Supabase Account

1. Go to: https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub or email

### Step 2: Create New Project

1. Click "New Project"
2. **Name:** Enter `limax-sms-platform`
3. **Database Password:** Generate a strong password (save it!)
4. **Region:** Choose closest region
5. Click "Create new project" (takes 1-2 minutes)

### Step 3: Get Connection String

1. Go to **Project Settings** → **Database**
2. Scroll to **Connection String**
3. Select **URI** tab
4. Copy the connection string (it looks like):
   ```
   postgresql://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

### Step 4: Update .env File

Open your `.env` file:

```env
DATABASE_URL="postgresql://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### Step 5: Test Connection

```powershell
cd "c:\Users\Hani\Desktop\Limax new\nextjs-app"
npx prisma db push
```

---

## Option 3: Railway (Alternative - Free Tier)

Railway offers a simple PostgreSQL setup.

### Step 1: Create Railway Account

1. Go to: https://railway.app
2. Sign up with GitHub

### Step 2: Create PostgreSQL Database

1. Click "New Project" → "Provision PostgreSQL"
2. Railway will create a database instance
3. Go to the database tab → "Connect"
4. Copy the **Connection URI**

### Step 3: Update .env File

```env
DATABASE_URL="postgresql://postgres:password@containers.railway.app:5432/railway"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

---

## Database URL Format Explained

The DATABASE_URL follows this format:

```
postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
```

- **user:** Database username
- **password:** Database password
- **host:** Database server address
- **port:** Database port (usually 5432)
- **database:** Database name
- **sslmode=require:** Required for cloud databases

---

## Testing Your Database Connection

After setting up your cloud database, test it with:

```powershell
cd "c:\Users\Hani\Desktop\Limax new\nextjs-app"
npx prisma studio
```

This opens Prisma Studio at `http://localhost:5555` where you can:
- View all tables
- Add/edit data
- Test your connection

---

## Switching Between Local and Cloud Databases

To switch databases, simply update the `DATABASE_URL` in your `.env` file and run:

```powershell
npx prisma db push
```

This will sync your schema with the new database.

---

## Recommended: Neon.tech

**Why Neon.tech?**
- ✅ Generous free tier (0.5 GB storage, ~300 hours compute)
- ✅ Auto-suspend when not in use (saves resources)
- ✅ Serverless scaling
- ✅ Built-in branching for development
- ✅ Simple connection strings
- ✅ Excellent documentation

---

## Security Best Practices

1. **Never commit .env to Git**
   - Ensure `.gitignore` includes `.env`
   - Your `.gitignore` already has this configured

2. **Use Strong Passwords**
   - Generate random passwords for cloud databases
   - Don't reuse passwords

3. **Enable SSL**
   - Always include `?sslmode=require` in cloud DATABASE_URL
   - Most cloud providers require SSL

4. **Restrict Access**
   - Use Vercel's environment variables for production
   - Don't share connection strings publicly

---

## Troubleshooting

### Error: "connection refused"
**Solution:** Check if your cloud database is active (not suspended)

### Error: "SSL required"
**Solution:** Add `?sslmode=require` to your DATABASE_URL

### Error: "authentication failed"
**Solution:** Verify username and password in DATABASE_URL

### Error: "database does not exist"
**Solution:** The database name in URL doesn't match your cloud database name

---

## Next Steps

After setting up your cloud database:
1. Test with `npx prisma db push`
2. Run `npm run dev` to start local server
3. Deploy to Vercel (see `DEPLOY-VERCEL.md`)
