# LAMIX SMS Command Center - API Documentation

## Base URL

```text
http://localhost:3000/api
```

## Authentication

All API endpoints (except login/register) require a Bearer token in the Authorization header:

```text
Authorization: Bearer <your-jwt-token>
```

## Response Format

### Success Response

```json
{
  "data": { ... },
  "message": "Success message"
}
```

### Error Response

```json
{
  "error": {
    "message": "Error message",
    "statusCode": 400
  }
}
```

## Endpoints

### Authentication Endpoints

#### POST /auth/login

Login to the application.

**Request Body:**

```json
{
  "email": "admin@lamix.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx123abc",
    "email": "admin@lamix.com",
    "role": "ADMIN"
  }
}
```

#### POST /auth/register

Register a new user (initial setup only).

**Request Body:**

```json
{
  "email": "admin@lamix.com",
  "password": "password123",
  "role": "ADMIN"
}
```

**Response:**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "clx123abc",
    "email": "admin@lamix.com",
    "role": "ADMIN"
  }
}
```

#### GET /auth/me

Get current user information.

**Response:**

```json
{
  "user": {
    "id": "clx123abc",
    "email": "admin@lamix.com",
    "role": "ADMIN",
    "isActive": true,
    "lastLoginAt": "2026-09-19T00:00:00.000Z",
    "createdAt": "2026-09-19T00:00:00.000Z"
  }
}
```

#### POST /auth/logout

Logout the current user.

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

### Dashboard

#### GET /dashboard/stats

Get dashboard statistics.

**Query Parameters:** None

**Response:**

```json
{
  "totalNumbers": 142,
  "activeNumbers": 128,
  "smsToday": 8427,
  "smsThisWeek": 58234,
  "successfulSms": 7891,
  "failedSms": 536,
  "todaysEarnings": 151.69,
  "availableBalance": 2847.52,
  "connectionStatus": {
    "lamix": "CONNECTED",
    "smpp": "CONNECTED",
    "http": "CONNECTED",
    "database": "CONNECTED",
    "redis": "CONNECTED",
    "smsProvider": "CONNECTED"
  }
}
```

#### GET /dashboard/traffic

Get traffic data for charts.

**Query Parameters:**

- `period` (string): Time period - `1H`, `6H`, `24H`, `7D`, `30D` (default: `24H`)

**Response:**

```json
{
  "data": [
    {
      "timestamp": "2026-09-19T00:00:00.000Z",
      "volume": 8427,
      "successful": 7891,
      "failed": 536,
      "earnings": "151.69"
    }
  ]
}
```

### Numbers

#### GET /numbers

Get all numbers with pagination and filters.

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search query
- `country` (string): Filter by country
- `range` (string): Filter by range
- `status` (string): Filter by status (`ACTIVE`, `INACTIVE`, `SUSPENDED`)

**Response:**

```json
{
  "numbers": [
    {
      "id": "clx123abc",
      "range": "Sri Lanka LX 14Aug",
      "country": "Sri Lanka",
      "prefix": "94",
      "number": "94740341974",
      "payout": 0.018,
      "plan": "7/7",
      "status": "ACTIVE",
      "lastActivityAt": "2026-09-19T00:00:00.000Z",
      "totalSms": 1247,
      "totalEarnings": 22.45,
      "createdAt": "2026-09-19T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8
  }
}
```

#### GET /numbers/:id

Get number details.

**Response:**

```json
{
  "id": "clx123abc",
  "range": "Sri Lanka LX 14Aug",
  "country": "Sri Lanka",
  "prefix": "94",
  "number": "94740341974",
  "payout": 0.018,
  "plan": "7/7",
  "status": "ACTIVE",
  "lastActivityAt": "2026-09-19T00:00:00.000Z",
  "totalSms": 1247,
  "totalEarnings": 22.45,
  "createdAt": "2026-09-19T00:00:00.000Z",
  "messages": [...]
}
```

#### POST /numbers/import

Import numbers from CSV.

**Request Body:**

```json
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

**Response:**

```json
{
  "message": "Numbers imported successfully",
  "imported": 10,
  "failed": 0
}
```

#### PATCH /numbers/:id/status

Update number status.

**Request Body:**

```json
{
  "status": "ACTIVE"
}
```

**Response:**

```json
{
  "message": "Number status updated",
  "number": { ... }
}
```

### SMS

#### POST /sms/send

Send an SMS message.

**Request Body:**

```json
{
  "destination": "+947123456789",
  "sender": "LAMIX",
  "message": "Your message here",
  "provider": "provider_name",
  "route": "route_name"
}
```

**Response:**

```json
{
  "message": "SMS queued for sending",
  "sms": {
    "id": "clx123abc",
    "destination": "+947123456789",
    "sender": "LAMIX",
    "messageHash": "abc123...",
    "status": "PENDING",
    "createdAt": "2026-09-19T00:00:00.000Z"
  }
}
```

#### POST /sms/otp

Generate and send an OTP.

**Request Body:**

```json
{
  "destination": "+947123456789",
  "expiry": 5
}
```

**Response (Demo Mode):**

```json
{
  "message": "OTP generated successfully (DEMO MODE)",
  "otp": "123456",
  "destination": "+947123456789",
  "expiry": 5,
  "template": "Your verification code is 123456. It expires in 5 minutes."
}
```

**Response (Production):**

```json
{
  "message": "OTP sent successfully",
  "destination": "+947123456789",
  "expiry": 5
}
```

#### GET /sms/:id

Get SMS status.

**Response:**

```json
{
  "id": "clx123abc",
  "destination": "+947123456789",
  "sender": "LAMIX",
  "messageHash": "abc123...",
  "status": "DELIVERED",
  "submittedAt": "2026-09-19T00:00:00.000Z",
  "deliveredAt": "2026-09-19T00:00:01.000Z",
  "deliveryReceipts": [...]
}
```

#### POST /sms/test-connection

Test connection to SMS provider.

**Request Body:**

```json
{
  "provider": "provider_name"
}
```

**Response:**

```json
{
  "message": "Connection test successful",
  "provider": "provider_name",
  "status": "CONNECTED",
  "latency": 45
}
```

### Inbound SMS

#### GET /inbound

Get inbound messages with pagination and filters.

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search query
- `country` (string): Filter by country
- `range` (string): Filter by range
- `fromDate` (string): Filter from date (ISO 8601)
- `toDate` (string): Filter to date (ISO 8601)

**Response:**

```json
{
  "messages": [
    {
      "id": "clx123abc",
      "date": "2026-09-19T00:00:00.000Z",
      "time": "14:32:15",
      "range": "Sri Lanka LX 14Aug",
      "number": "94740341974",
      "cli": "947123456789",
      "message": "Your verification code is 123456",
      "currency": "USD",
      "payout": 0.018,
      "status": "RECEIVED",
      "createdAt": "2026-09-19T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### GET /inbound/:id

Get inbound message details.

**Response:**

```json
{
  "id": "clx123abc",
  "date": "2026-09-19T00:00:00.000Z",
  "time": "14:32:15",
  "range": "Sri Lanka LX 14Aug",
  "number": "94740341974",
  "cli": "947123456789",
  "message": "Your verification code is 123456",
  "currency": "USD",
  "payout": 0.018,
  "status": "RECEIVED",
  "createdAt": "2026-09-19T00:00:00.000Z"
}
```

### Reports

#### POST /reports/generate

Generate a detailed report.

**Request Body:**

```json
{
  "fromDate": "2026-09-13",
  "toDate": "2026-09-19",
  "range": "",
  "number": "",
  "cli": "",
  "currency": "",
  "status": "",
  "groupBy": "day"
}
```

**Response:**

```json
{
  "summary": {
    "totalSms": 58234,
    "successful": 54892,
    "failed": 3342,
    "pending": 0,
    "totalEarnings": 1048.21,
    "averagePayout": 0.018,
    "successRate": 94.3
  },
  "data": [
    {
      "date": "2026-09-19",
      "volume": 8427,
      "successful": 7891,
      "failed": 536,
      "earnings": 151.69
    }
  ],
  "filters": {
    "fromDate": "2026-09-13",
    "toDate": "2026-09-19",
    "groupBy": "day"
  }
}
```

#### POST /reports/export

Export report to CSV or XLSX.

**Request Body:**

```json
{
  "format": "csv",
  "reportData": { ... }
}
```

**Response:**

```json
{
  "message": "Report exported as CSV",
  "format": "csv",
  "downloadUrl": "/api/reports/download/report-123.csv"
}
```

### Integration

#### GET /integration/smpp

Get SMPP configuration.

**Response:**

```json
{
  "host": "smpp.provider.com",
  "port": 2775,
  "systemId": "your_system_id",
  "systemType": "SMPP",
  "ton": 0,
  "npi": 1,
  "tls": false,
  "isConfigured": true
}
```

#### POST /integration/smpp

Save SMPP configuration (ADMIN only).

**Request Body:**

```json
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

**Response:**

```json
{
  "message": "SMPP configuration saved"
}
```

#### POST /integration/smpp/test

Test SMPP connection (ADMIN only).

**Response:**

```json
{
  "message": "SMPP connection test successful",
  "status": "CONNECTED",
  "latency": 85
}
```

#### GET /integration/http

Get HTTP API configuration.

**Response:**

```json
{
  "endpoint": "https://api.provider.com/sms",
  "apiKey": "your_api_key",
  "bearerToken": "",
  "username": "",
  "senderId": "LAMIX",
  "isConfigured": true
}
```

#### POST /integration/http

Save HTTP API configuration (ADMIN only).

**Request Body:**

```json
{
  "endpoint": "https://api.provider.com/sms",
  "apiKey": "your_api_key",
  "bearerToken": "your_bearer_token",
  "username": "your_username",
  "password": "your_password",
  "senderId": "LAMIX"
}
```

**Response:**

```json
{
  "message": "HTTP API configuration saved"
}
```

#### POST /integration/http/test

Test HTTP connection (ADMIN only).

**Response:**

```json
{
  "message": "HTTP API connection test successful",
  "status": "CONNECTED",
  "latency": 32
}
```

#### GET /integration/status

Get connection status for all integrations.

**Response:**

```json
{
  "smpp": {
    "status": "CONNECTED",
    "connectedAt": "2026-09-19T00:00:00.000Z"
  },
  "http": {
    "status": "CONNECTED",
    "connectedAt": "2026-09-19T00:00:00.000Z"
  },
  "database": {
    "status": "CONNECTED"
  },
  "redis": {
    "status": "CONNECTED"
  }
}
```

### Settings

#### GET /settings

Get all settings.

**Query Parameters:**

- `category` (string): Filter by category

**Response:**

```json
[
  {
    "id": "clx123abc",
    "key": "setting_key",
    "value": "setting_value",
    "category": "GENERAL",
    "description": "Setting description",
    "isSecret": false,
    "updatedAt": "2026-09-19T00:00:00.000Z"
  }
]
```

#### PATCH /settings/:key

Update a setting (ADMIN only).

**Request Body:**

```json
{
  "value": "new_value"
}
```

**Response:**

```json
{
  "message": "Setting updated",
  "setting": { ... }
}
```

#### GET /settings/preferences

Get user preferences.

**Response:**

```json
{
  "theme": "luxury-dark",
  "animationIntensity": "normal",
  "compactMode": false,
  "timezone": "UTC",
  "currency": "USD",
  "autoRefreshInterval": 30000
}
```

#### PATCH /settings/preferences

Update user preferences.

**Request Body:**

```json
{
  "theme": "luxury-dark",
  "animationIntensity": "normal",
  "compactMode": false,
  "timezone": "UTC",
  "currency": "USD",
  "autoRefreshInterval": 30000
}
```

**Response:**

```json
{
  "message": "Preferences updated",
  "preferences": { ... }
}
```

## Error Codes

| Status Code | Description |
| ------------- | ------------- |
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Rate Limiting

API requests are rate-limited to 100 requests per 15 minutes per IP address.

## WebSocket Events

### Client to Server

- `join` - Join a room
- `leave` - Leave a room

### Server to Client

- `sms:delivered` - SMS delivery confirmation
- `sms:failed` - SMS delivery failure
- `incoming:sms` - New inbound message
- `connection:status` - Connection status update

## Demo Mode

When `DEMO_MODE=true`, the API returns simulated data for testing purposes. All demo responses are clearly labeled.

## Security Notes

- All sensitive endpoints require ADMIN role
- Passwords are never returned in API responses
- OTP values are only shown in demo mode
- SMPP/HTTP credentials are encrypted in production
- All requests are logged for audit purposes
