import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { isDemoMode } from '../config/mode';

function decodeSmppMessage(pdu: Record<string, unknown>): string {
  const shortMessage = pdu.short_message;
  if (typeof shortMessage === 'string') return shortMessage;
  if (Buffer.isBuffer(shortMessage)) return shortMessage.toString('utf8');
  if (shortMessage instanceof Uint8Array) return Buffer.from(shortMessage).toString('utf8');
  return '';
}

function isDeliveryReceipt(pdu: Record<string, unknown>): boolean {
  const esmClass = pdu.esm_class as number | undefined;
  return esmClass === 4 || esmClass === 0x04;
}

export function setupInboundSmppHandler(io: SocketIOServer): void {
  // Handler wired from index.ts on smppManager 'deliver_sm'
  void io;
}

export async function handleDeliverSm(
  pdu: Record<string, unknown>,
  io: SocketIOServer
): Promise<void> {
  if (isDemoMode()) {
    return;
  }

  if (isDeliveryReceipt(pdu)) {
    await handleDeliveryReceipt(pdu);
    return;
  }

  const sender = String(pdu.source_addr ?? '');
  const recipient = String(pdu.destination_addr ?? '');
  const message = decodeSmppMessage(pdu);
  const providerMessageId =
    typeof pdu.message_id === 'string' ? pdu.message_id : undefined;

  if (!sender || !message) {
    logger.warn('Ignoring invalid deliver_sm', { service: 'smpp', event: 'deliver_sm_invalid' });
    return;
  }

  const now = new Date();
  const matchedNumber = await prisma.number.findFirst({
    where: { number: recipient.replace(/^\+/, '') },
  });

  const inbound = await prisma.inboundMessage.create({
    data: {
      date: now,
      time: now.toISOString().slice(11, 19),
      range: matchedNumber?.range ?? 'unknown',
      number: matchedNumber?.number ?? recipient,
      recipient,
      numberId: matchedNumber?.id,
      cli: sender,
      message,
      providerMessageId,
      currency: 'USD',
      payout: matchedNumber?.payout ?? 0,
      status: 'RECEIVED',
      processingStatus: 'PROCESSED',
    },
  });

  if (matchedNumber && matchedNumber.payout > 0) {
    await prisma.earningRecord.create({
      data: {
        inboundMessageId: inbound.id,
        rate: matchedNumber.payout,
        currency: 'USD',
        billableStatus: 'INBOUND_RECEIVED',
        range: matchedNumber.range,
        number: matchedNumber.number,
      },
    });
  }

  await prisma.providerEvent.create({
    data: {
      source: 'SMPP',
      eventType: 'deliver_sm',
      externalId: providerMessageId,
      payload: pdu as object,
    },
  });

  io.emit('inbound:sms', {
    id: inbound.id,
    cli: inbound.cli,
    number: inbound.number,
    message: inbound.message,
    receivedAt: inbound.createdAt.toISOString(),
  });

  logger.info('Inbound SMS stored', {
    service: 'smpp',
    event: 'deliver_sm_stored',
    inboundId: inbound.id,
    cli: sender,
  });
}

async function handleDeliveryReceipt(pdu: Record<string, unknown>): Promise<void> {
  const receiptText = decodeSmppMessage(pdu);
  const idMatch = receiptText.match(/id:([^\s]+)/i);
  const statMatch = receiptText.match(/stat:([^\s]+)/i);
  const providerId = idMatch?.[1];

  if (!providerId) {
    return;
  }

  const message = await prisma.message.findFirst({
    where: { providerMessageId: providerId },
  });

  if (!message) {
    await prisma.providerEvent.create({
      data: {
        source: 'SMPP',
        eventType: 'delivery_receipt_orphan',
        externalId: providerId,
        payload: { receiptText, pdu: pdu as object },
      },
    });
    return;
  }

  const stat = statMatch?.[1]?.toUpperCase() ?? 'UNKNOWN';
  const delivered = stat === 'DELIVRD';

  await prisma.deliveryReceipt.create({
    data: {
      messageId: message.id,
      status: stat,
      timestamp: new Date(),
    },
  });

  await prisma.message.update({
    where: { id: message.id },
    data: delivered
      ? { status: 'DELIVERED', deliveredAt: new Date() }
      : { status: 'FAILED', failedAt: new Date(), errorMessage: `Delivery receipt: ${stat}` },
  });

  if (delivered && message.numberId) {
    const number = await prisma.number.findUnique({ where: { id: message.numberId } });
    if (number && number.payout > 0) {
      const existing = await prisma.earningRecord.findFirst({
        where: { messageId: message.id },
      });
      if (!existing) {
        await prisma.earningRecord.create({
          data: {
            messageId: message.id,
            rate: number.payout,
            currency: 'USD',
            billableStatus: 'OUTBOUND_DELIVERED',
            range: number.range,
            number: number.number,
          },
        });
      }
    }
  }
}
