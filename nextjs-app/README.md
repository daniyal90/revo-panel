# Revo Panel - SMS Traffic Monetization Platform

A production-ready full-stack application for SMS traffic monetization, inspired by Lamix.org. Built with Next.js 14, Prisma, PostgreSQL, and Tailwind CSS.

## 🚀 Features

### Landing Page (Public)
- **Hero Section**: Clean UI with high-converting headline, CTA buttons, and live UTC server clock
- **Live Traffic Monitor**: Dynamic component showing real-time country number ranges, rates, and message status updates
- **4-Step Process Section**: Visual onboarding guide (Register → Pick Ranges → Route Traffic → Get Payout)
- **Value Proposition Grid**: 69+ destinations, real-time tracking, zero setup fees, 24/7 support
- **FAQ Accordion**: Interactive FAQ section with expandable answers
- **Contact Section**: WhatsApp and Telegram integration links

### User Dashboard
- **Analytics Overview**: Real-time metrics (Total Traffic, Delivered SMS, Net Earnings, Pending Payouts)
- **Active Ranges & Rates Table**: Searchable/filterable table with Country, Prefix, Rate, Status, and Claim Range action
- **Traffic Integration Panel**: HTTP Endpoint URLs, API Keys, and SMPP 3.4 bind credentials
- **Financials & Wallet**: Minimum payout progress bar ($50 limit), withdrawal methods (USDT-TRC20, Wise, Bank Wire), downloadable payout history

### Admin Control Panel (Planned)
- User Management: Approve/Reject accounts, set custom rates, view logs
- Range Management: Add/Edit/Rotate country ranges and update payouts
- Financial Settlement: Process weekly Tuesday payouts, generate reports

## 🛠 Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend**: Next.js Server Actions / Route Handlers
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Email/Password, Role-Based Access Control: ADMIN, USER)
- **Styling**: Tailwind CSS with custom dark theme

## 📁 Project Structure

```
nextjs-app/
├── prisma/
│   └── schema.prisma          # Database schema (User, Range, TrafficLog, Payout)
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   └── page.tsx       # User dashboard with analytics, ranges, integration, financials
│   │   ├── globals.css        # Global styles and Tailwind directives
│   │   ├── layout.tsx         # Root layout with metadata
│   │   └── page.tsx           # Landing page (hero, traffic monitor, FAQ, contact)
│   └── lib/
│       └── utils.ts           # Utility functions (cn for className merging)
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── next.config.js             # Next.js configuration
├── package.json               # Dependencies and scripts
├── postcss.config.js          # PostCSS configuration
├── tailwind.config.ts         # Tailwind CSS configuration
└── tsconfig.json              # TypeScript configuration
```

## 🗄 Database Schema

### Models

**User**
- `id`: String (CUID)
- `email`: String (unique)
- `passwordHash`: String
- `name`: String (optional)
- `role`: UserRole (ADMIN, USER)
- `isActive`: Boolean
- `customRate`: Float (optional)
- `lastLoginAt`: DateTime (optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Range**
- `id`: String (CUID)
- `country`: String
- `prefix`: String
- `startNumber`: String
- `endNumber`: String
- `ratePerSms`: Float
- `status`: RangeStatus (ACTIVE, MAINTENANCE, INACTIVE)
- `userId`: String (optional, relation to User)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**TrafficLog**
- `id`: String (CUID)
- `rangeId`: String (relation to Range)
- `userId`: String (relation to User)
- `destination`: String
- `sender`: String
- `messageBody`: String
- `status`: MessageStatus (PENDING, DELIVERED, FAILED)
- `deliveredAt`: DateTime (optional)
- `earnings`: Float
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Payout**
- `id`: String (CUID)
- `userId`: String (relation to User)
- `amount`: Float
- `currency`: String (default: USD)
- `status`: PayoutStatus (PENDING, PROCESSING, PAID, FAILED)
- `method`: PayoutMethod (USDT_TRC20, WISE, BANK_WIRE)
- `methodDetails`: JSON (optional)
- `processedAt`: DateTime (optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**AuditLog**
- `id`: String (CUID)
- `userId`: String (optional, relation to User)
- `action`: String
- `entity`: String
- `entityId`: String (optional)
- `details`: JSON (optional)
- `ipAddress`: String (optional)
- `userAgent`: String (optional)
- `createdAt`: DateTime

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running locally or remotely
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   cd nextjs-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your values:
   ```
	  DATABASE_URL="postgresql://user:password@localhost:5432/revo_db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 Customization

### Theme Colors

The application uses a dark theme with CSS variables defined in `src/app/globals.css`. You can customize colors by modifying the HSL values:

```css
:root {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  /* ... */
}
```

### Adding New Destinations

To add new country ranges, update the `mockRanges` array in `src/app/dashboard/page.tsx` or use the Prisma Client to add entries to the database.

## 🔐 Security Considerations

- Never commit `.env` files to version control
- Use strong secrets for `NEXTAUTH_SECRET`
- Implement rate limiting for API endpoints
- Use HTTPS in production
- Validate all user inputs
- Implement proper authentication and authorization

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Support

For support, contact via:
- WhatsApp: +1234567890
  - Telegram: @revo_support

---

Built with ❤️ for SMS traffic monetization
