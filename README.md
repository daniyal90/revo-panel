# LAMIX SMS Command Center

A production-quality SMS management application for authorized A2P/transactional/OTP SMS traffic.

## Features

- **Premium Dashboard** - Real-time statistics, traffic monitoring, and connection status
- **Number Management** - Import, manage, and monitor SMS numbers
- **Send SMS/OTP** - Send SMS messages and generate OTP codes with validation
- **Incoming SMS** - View and manage inbound messages with OTP detection
- **Reports** - Generate detailed reports with filters and charts
- **SMPP/HTTP Integration** - Configure SMPP 3.4 and HTTP API connections
- **Real-time Updates** - WebSocket support for live data updates
- **Demo Mode** - Test the UI without real SMS credentials
- **Security** - Authentication, role-based access, and secure configuration

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Recharts
- Socket.IO Client
- Zustand

### Backend
- Node.js
- TypeScript
- Express
- Prisma ORM
- PostgreSQL
- Redis + BullMQ
- Socket.IO
- Winston (Logging)

## Project Structure

```
limax-sms/
├── backend/              # Backend application
│   ├── src/
│   │   ├── index.ts     # Application entry point
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Express middleware
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utility functions
│   ├── package.json
│   └── tsconfig.json
├── frontend/             # Frontend application
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── store/       # State management
│   │   └── utils/       # Utility functions
│   ├── package.json
│   └── tsconfig.json
├── database/             # Database schema
│   └── schema.prisma
├── docs/                 # Documentation
└── .env.example          # Environment variables template
```

## Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd limax-sms
   ```

2. **Install dependencies**

   Backend:
   ```bash
   cd backend
   npm install
   ```

   Frontend:
   ```bash
   cd frontend
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` in the backend directory:
   ```bash
   cd backend
   cp ../.env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/lamix_sms"
   REDIS_HOST=localhost
   REDIS_PORT=6379
   JWT_SECRET=your-super-secret-jwt-key
   DEMO_MODE=true
   ```

4. **Set up the database**

   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Create admin user**

   The application will create an admin user on first login in demo mode.

## Development

### Start Backend

```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:3000`

### Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173`

## Production Build

### Build Backend

```bash
cd backend
npm run build
npm start
```

### Build Frontend

```bash
cd frontend
npm run build
npm run preview
```

## API Documentation

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@lamix.com",
  "password": "password"
}
```

#### Register (Initial Setup)
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@lamix.com",
  "password": "password123",
  "role": "ADMIN"
}
```

### Dashboard

#### Get Statistics
```http
GET /api/dashboard/stats
Authorization: Bearer <token>
```

#### Get Traffic Data
```http
GET /api/dashboard/traffic?period=24H
Authorization: Bearer <token>
```

### Numbers

#### Get Numbers
```http
GET /api/numbers?page=1&limit=20&search=&country=&status=
Authorization: Bearer <token>
```

#### Import Numbers
```http
POST /api/numbers/import
Authorization: Bearer <token>
Content-Type: application/json

{
  "numbers": [
    {
      "range": "Sri Lanka LX 14Aug",
      "country": "Sri Lanka",
      "prefix": "94",
      "number": "94740341974",
      "payout": 0.018,
      "plan": "7/7"
    }
  ]
}
```

### SMS

#### Send SMS
```http
POST /api/sms/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "destination": "+947123456789",
  "sender": "LAMIX",
  "message": "Your message here",
  "provider": "provider_name",
  "route": "route_name"
}
```

#### Generate OTP
```http
POST /api/sms/otp
Authorization: Bearer <token>
Content-Type: application/json

{
  "destination": "+947123456789",
  "expiry": 5
}
```

### Integration

#### Save SMPP Configuration
```http
POST /api/integration/smpp
Authorization: Bearer <token>
Content-Type: application/json

{
  "host": "smpp.provider.com",
  "port": 2775,
  "systemId": "your_system_id",
  "password": "your_password",
  "systemType": "SMPP",
  "ton": 0,
  "npi": 1,
  "tls": false
}
```

#### Save HTTP Configuration
```http
POST /api/integration/http
Authorization: Bearer <token>
Content-Type: application/json

{
  "endpoint": "https://api.provider.com/sms",
  "apiKey": "your_api_key",
  "bearerToken": "your_bearer_token",
  "senderId": "LAMIX"
}
```

## Demo Mode

The application includes a demo mode for testing the UI without real SMS credentials.

To enable demo mode, set in your `.env`:
```env
DEMO_MODE=true
```

**Important:** Demo mode is clearly labeled throughout the UI. Demo data should never be mixed with real production data.

## Security

- JWT-based authentication
- Role-based access control (ADMIN, OPERATOR, VIEWER)
- Rate limiting
- Input validation
- SQL injection protection (via Prisma)
- XSS protection
- CSRF protection
- Secure password hashing (bcrypt)
- Secret management (environment variables)

## Roles

- **ADMIN** - Full access including integration configuration
- **OPERATOR** - Can send SMS and manage numbers
- **VIEWER** - Read-only access

## Important Notes

- This application is intended ONLY for legitimate, authorized A2P/transactional/OTP SMS traffic
- Do NOT use for fake SMS generation, OTP farming, or verification bypass
- SMPP/HTTP credentials must be obtained from authorized providers
- Never hard-code API passwords or secrets
- Use environment variables for all sensitive configuration
- OTP values are never logged or stored unnecessarily

## License

Proprietary - All rights reserved

## Support

For support and documentation, contact your Lamix representative.
