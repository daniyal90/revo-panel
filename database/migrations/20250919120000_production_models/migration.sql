-- CreateEnum
CREATE TYPE "TransportType" AS ENUM ('SMPP', 'HTTP');

-- CreateEnum
CREATE TYPE "InboundProcessingStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "MessageStatus_new" AS ENUM ('PENDING', 'RETRYING', 'SUBMITTED', 'SENT', 'DELIVERED', 'FAILED', 'EXPIRED');
ALTER TABLE "Message" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Message" ALTER COLUMN "status" TYPE "MessageStatus_new" USING ("status"::text::"MessageStatus_new");
ALTER TYPE "MessageStatus" RENAME TO "MessageStatus_old";
ALTER TYPE "MessageStatus_new" RENAME TO "MessageStatus";
DROP TYPE "MessageStatus_old";
ALTER TABLE "Message" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable Message
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "messageBody" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "transport" "TransportType" NOT NULL DEFAULT 'SMPP';
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "providerName" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "routeName" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "providerMessageId" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "providerResponse" JSONB;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "retryCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable InboundMessage
ALTER TABLE "InboundMessage" ADD COLUMN IF NOT EXISTS "recipient" TEXT;
ALTER TABLE "InboundMessage" ADD COLUMN IF NOT EXISTS "providerMessageId" TEXT;
ALTER TABLE "InboundMessage" ADD COLUMN IF NOT EXISTS "processingStatus" "InboundProcessingStatus" NOT NULL DEFAULT 'RECEIVED';

-- CreateTable MessageAttempt
CREATE TABLE IF NOT EXISTS "MessageAttempt" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "providerResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable ProviderEvent
CREATE TABLE IF NOT EXISTS "ProviderEvent" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "messageId" TEXT,
    "externalId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProviderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable EarningRecord
CREATE TABLE IF NOT EXISTS "EarningRecord" (
    "id" TEXT NOT NULL,
    "messageId" TEXT,
    "inboundMessageId" TEXT,
    "rate" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billableStatus" TEXT NOT NULL,
    "range" TEXT,
    "number" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EarningRecord_pkey" PRIMARY KEY ("id")
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
ALTER TABLE "MessageAttempt" ADD CONSTRAINT "MessageAttempt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EarningRecord" ADD CONSTRAINT "EarningRecord_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS "EarningRecord_inboundMessageId_key" ON "EarningRecord"("inboundMessageId");
