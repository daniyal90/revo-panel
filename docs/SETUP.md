# Setup Guide

## Prerequisites

Before installing LAMIX SMS Command Center, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **Redis** (v6 or higher) - [Download](https://redis.io/download)
- **Git** - [Download](https://git-scm.com/downloads)

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd limax-sms
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cd backend
cp ../.env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/lamix_sms"
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# SMPP Configuration (Generic - Replace with actual Lamix credentials)
LAMIX_SMPP_HOST=
LAMIX_SMPP_PORT=2775
LAMIX_SMPP_SYSTEM_ID=
LAMIX_SMPP_PASSWORD=
LAMIX_SMPP_SYSTEM_TYPE=
LAMIX_SMPP_TON=0
LAMIX_SMPP_NPI=1
LAMIX_SMPP_TLS=false

# HTTP API Configuration (Generic - Replace with actual Lamix credentials)
LAMIX_HTTP_ENDPOINT=
LAMIX_HTTP_API_KEY=
LAMIX_HTTP_BEARER_TOKEN=
LAMIX_HTTP_USERNAME=
LAMIX_HTTP_PASSWORD=

# Demo Mode
DEMO_MODE=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key-change-this
```

### 5. Set Up PostgreSQL Database

#### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE lamix_sms;

# Exit
\q
```

#### Run Migrations

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 6. Start Redis

```bash
# On Windows
redis-server

# On Linux/Mac
redis-server
```

### 7. Start Development Servers

#### Backend (Terminal 1)

```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:3000`

#### Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173`

### 8. Access the Application

Open your browser and navigate to:

```
http://localhost:5173
```

## Initial Setup

### Create Admin User

In demo mode, you can log in with any email/password combination. The system will create an admin user automatically.

For production, use the registration endpoint:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lamix.com",
    "password": "secure_password",
    "role": "ADMIN"
  }'
```

## Production Deployment

### Build Backend

```bash
cd backend
npm run build
```

### Build Frontend

```bash
cd frontend
npm run build
```

### Environment Variables for Production

Update your `.env` file for production:

```env
NODE_ENV=production
DEMO_MODE=false
```

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start dist/index.js --name lamix-backend

# Start frontend (serve built files)
cd frontend
pm2 serve dist 5173 --name lamix-frontend --spa

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### Using Docker (Optional)

Create a `Dockerfile` for the backend:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

Create a `Dockerfile` for the frontend:

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run with Docker Compose:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: lamix_sms
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/lamix_sms
      REDIS_HOST: redis
      REDIS_PORT: 6379

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify PostgreSQL is running:
   ```bash
   # Windows
   sc query postgresql-x64-14

   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. Check your `DATABASE_URL` in `.env`

3. Ensure the database exists:
   ```bash
   psql -U postgres -c "SELECT datname FROM pg_database WHERE datname='lamix_sms';"
   ```

### Redis Connection Issues

If Redis fails to connect:

1. Verify Redis is running:
   ```bash
   redis-cli ping
   ```

2. Check your Redis configuration in `.env`

### Port Already in Use

If ports 3000 or 5173 are already in use:

1. Change the ports in `.env`:
   ```env
   PORT=3001
   ```

2. Or kill the process using the port:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F

   # Linux/Mac
   lsof -ti:3000 | xargs kill -9
   ```

### Prisma Migration Issues

If migrations fail:

1. Reset the database (WARNING: This deletes all data):
   ```bash
   npx prisma migrate reset
   ```

2. Or create a new migration:
   ```bash
   npx prisma migrate dev --name fix
   ```

## Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong, random value
- [ ] Change `ENCRYPTION_KEY` to a 32-character random string
- [ ] Set `DEMO_MODE=false`
- [ ] Set `NODE_ENV=production`
- [ ] Configure HTTPS/TLS
- [ ] Set up firewall rules
- [ ] Configure database backups
- [ ] Enable audit logging
- [ ] Review and update CORS settings
- [ ] Set up monitoring and alerting

## Next Steps

- Configure SMPP/HTTP integration with your provider
- Import your SMS numbers
- Set up routing rules
- Configure notification settings
- Review the [API Documentation](./API.md)
- Check the [README](../README.md) for more information
