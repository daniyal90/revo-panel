-- This migration creates the complete schema expected by Prisma for a fresh database.
-- Enums (create if not exists using safe checks)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
	CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATOR', 'VIEWER');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'providertype') THEN
	CREATE TYPE "ProviderType" AS ENUM ('SMPP', 'HTTP');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transporttype') THEN
	CREATE TYPE "TransportType" AS ENUM ('SMPP', 'HTTP');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'messagestatus') THEN
	CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'RETRYING', 'SUBMITTED', 'SENT', 'DELIVERED', 'FAILED', 'EXPIRED');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'numberstatus') THEN
	CREATE TYPE "NumberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inboundprocessingstatus') THEN
	CREATE TYPE "InboundProcessingStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED');
  END IF;
END
$$;

-- Tables
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Range" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "country" TEXT NOT NULL,
  "prefix" TEXT NOT NULL,
  "startNumber" TEXT NOT NULL,
  "endNumber" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Number" (
  "id" TEXT PRIMARY KEY,
  "range" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "prefix" TEXT NOT NULL,
  "number" TEXT NOT NULL UNIQUE,
  "payout" DOUBLE PRECISION NOT NULL,
  "plan" TEXT NOT NULL,
  "status" "NumberStatus" NOT NULL DEFAULT 'ACTIVE',
  "lastActivityAt" TIMESTAMP(3),
  "totalSms" INTEGER NOT NULL DEFAULT 0,
  "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Provider" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "type" "ProviderType" NOT NULL,
  "config" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Route" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "providerId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT PRIMARY KEY,
  "externalId" TEXT UNIQUE,
  "destination" TEXT NOT NULL,
  "sender" TEXT NOT NULL,
  "messageBody" TEXT NOT NULL DEFAULT '',
  "messageHash" TEXT NOT NULL,
  "transport" "TransportType" NOT NULL DEFAULT 'SMPP',
  "providerId" TEXT,
  "routeId" TEXT,
  "numberId" TEXT,
  "providerName" TEXT,
  "routeName" TEXT,
  "providerMessageId" TEXT,
  "providerResponse" JSONB,
  "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "submittedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "MessageAttempt" (
  "id" TEXT PRIMARY KEY,
  "messageId" TEXT NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "providerResponse" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ProviderEvent" (
  "id" TEXT PRIMARY KEY,
  "source" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "messageId" TEXT,
  "externalId" TEXT,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "EarningRecord" (
  "id" TEXT PRIMARY KEY,
  "messageId" TEXT,
  "inboundMessageId" TEXT UNIQUE,
  "rate" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "billableStatus" TEXT NOT NULL,
  "range" TEXT,
  "number" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "InboundMessage" (
  "id" TEXT PRIMARY KEY,
  "date" TIMESTAMP(3) NOT NULL,
  "time" TEXT NOT NULL,
  "range" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "recipient" TEXT,
  "numberId" TEXT,
  "cli" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "providerMessageId" TEXT,
  "currency" TEXT NOT NULL,
  "payout" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL,
  "processingStatus" "InboundProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "DeliveryReceipt" (
  "id" TEXT PRIMARY KEY,
  "messageId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL,
  "errorCode" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "details" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SystemSetting" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT,
  "isSecret" BOOLEAN NOT NULL DEFAULT FALSE,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS "Message_messageHash_idx" ON "Message"("messageHash");
CREATE INDEX IF NOT EXISTS "Message_providerMessageId_idx" ON "Message"("providerMessageId");
CREATE INDEX IF NOT EXISTS "Message_destination_idx" ON "Message"("destination");
CREATE INDEX IF NOT EXISTS "Message_sender_idx" ON "Message"("sender");
CREATE INDEX IF NOT EXISTS "Message_status_idx" ON "Message"("status");
CREATE INDEX IF NOT EXISTS "Message_createdAt_idx" ON "Message"("createdAt");
CREATE INDEX IF NOT EXISTS "MessageAttempt_messageId_idx" ON "MessageAttempt"("messageId");
CREATE INDEX IF NOT EXISTS "MessageAttempt_createdAt_idx" ON "MessageAttempt"("createdAt");
CREATE INDEX IF NOT EXISTS "ProviderEvent_messageId_idx" ON "ProviderEvent"("messageId");
CREATE INDEX IF NOT EXISTS "ProviderEvent_externalId_idx" ON "ProviderEvent"("externalId");
CREATE INDEX IF NOT EXISTS "ProviderEvent_createdAt_idx" ON "ProviderEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "EarningRecord_createdAt_idx" ON "EarningRecord"("createdAt");
CREATE INDEX IF NOT EXISTS "EarningRecord_billableStatus_idx" ON "EarningRecord"("billableStatus");
CREATE INDEX IF NOT EXISTS "InboundMessage_cli_idx" ON "InboundMessage"("cli");
CREATE INDEX IF NOT EXISTS "InboundMessage_number_idx" ON "InboundMessage"("number");
CREATE INDEX IF NOT EXISTS "InboundMessage_providerMessageId_idx" ON "InboundMessage"("providerMessageId");
CREATE INDEX IF NOT EXISTS "InboundMessage_createdAt_idx" ON "InboundMessage"("createdAt");

-- Foreign keys
ALTER TABLE IF EXISTS "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "Route" ADD CONSTRAINT "Route_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "Message" ADD CONSTRAINT "Message_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "Message" ADD CONSTRAINT "Message_numberId_fkey" FOREIGN KEY ("numberId") REFERENCES "Number"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "MessageAttempt" ADD CONSTRAINT "MessageAttempt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "EarningRecord" ADD CONSTRAINT "EarningRecord_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "InboundMessage" ADD CONSTRAINT "InboundMessage_numberId_fkey" FOREIGN KEY ("numberId") REFERENCES "Number"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "DeliveryReceipt" ADD CONSTRAINT "DeliveryReceipt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- Unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "EarningRecord_inboundMessageId_key" ON "EarningRecord"("inboundMessageId");
