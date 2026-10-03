# Limax SMS Monetization Platform - One-Command Setup Script
# Run this script to automatically set up the local development environment

Write-Host "🚀 Setting up Limax SMS Monetization Platform..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
Write-Host "🔍 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
Write-Host "🔍 Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm is installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take 2-5 minutes..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Create .env file
Write-Host "🔧 Creating .env file..." -ForegroundColor Yellow
if (!(Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "✅ .env file created from .env.example" -ForegroundColor Green
    Write-Host "⚠️  IMPORTANT: Please update the following in .env:" -ForegroundColor Yellow
    Write-Host "   - DATABASE_URL: Your PostgreSQL connection string" -ForegroundColor Cyan
    Write-Host "   - NEXTAUTH_SECRET: Generate a random secret" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Generate NEXTAUTH_SECRET:" -ForegroundColor Cyan
    Write-Host "  PowerShell: openssl rand -base64 32" -ForegroundColor White
    Write-Host "  Or visit: https://generate-secret.vercel.app/32" -ForegroundColor White
} else {
    Write-Host "⚠️  .env file already exists. Skipping creation." -ForegroundColor Yellow
}

Write-Host ""

# Generate Prisma Client
Write-Host "🗄️  Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma Client generated successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    Write-Host "⚠️  This is expected if DATABASE_URL is not yet configured" -ForegroundColor Yellow
}

Write-Host ""

# Ask user if they want to push database schema
Write-Host "📊 Do you want to push the database schema now?" -ForegroundColor Yellow
Write-Host "This requires a configured DATABASE_URL in .env" -ForegroundColor Cyan
$pushSchema = Read-Host "Enter 'y' to push schema, or 'n' to skip (default: n)"

if ($pushSchema -eq 'y' -or $pushSchema -eq 'Y') {
    Write-Host "📊 Pushing database schema..." -ForegroundColor Yellow
    npx prisma db push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database schema pushed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to push database schema" -ForegroundColor Red
        Write-Host "⚠️  Please check your DATABASE_URL in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Skipping database schema push" -ForegroundColor Cyan
    Write-Host "You can run 'npx prisma db push' later after configuring DATABASE_URL" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update .env with your DATABASE_URL and NEXTAUTH_SECRET" -ForegroundColor Cyan
Write-Host "2. Run: npx prisma db push (if not done already)" -ForegroundColor Cyan
Write-Host "3. Run: npm run dev" -ForegroundColor Cyan
Write-Host "4. Open: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "For detailed setup instructions, see:" -ForegroundColor Yellow
Write-Host "- SETUP-LOCAL.md (Local setup)" -ForegroundColor Cyan
Write-Host "- SETUP-CLOUD-DB.md (Cloud database)" -ForegroundColor Cyan
Write-Host "- DEPLOY-VERCEL.md (Vercel deployment)" -ForegroundColor Cyan
Write-Host "- TESTING-CHROME.md (Chrome testing)" -ForegroundColor Cyan
Write-Host ""
