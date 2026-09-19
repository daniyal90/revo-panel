import test from 'node:test';
import assert from 'node:assert/strict';
import { processSmsJob, SmsJobData } from './services/messageQueue';
import { prisma } from './lib/prisma';

test('processSmsJob handles successful send and updates message', async () => {
  process.env.LAMIX_MODE = 'production';

  const job: any = {
    id: 'job-1',
    data: {
      messageId: 'msg-1',
      destination: '+100',
      sender: 'SENDER',
      message: 'hello',
      transport: 'SMPP',
      idempotencyKey: 'msg-1',
    } as SmsJobData,
    attemptsMade: 0,
    opts: {},
  };

  let updatedBefore: any = null;
  let updatedAfter: any = null;

  // @ts-ignore
  prisma.message.update = async (args: any) => {
    if (!updatedBefore) {
      updatedBefore = args;
      return { id: 'msg-1' };
    }
    updatedAfter = args;
    return { id: 'msg-1' };
  };

  // @ts-ignore
  prisma.messageAttempt.create = async (_: any) => ({ id: 'att-1' });

  // Stub sendViaTransport by replacing the module function
  const transport = await import('./services/smsTransport');
  if (typeof (transport as any).overrideSendViaTransport === 'function') {
    // @ts-ignore
    transport.overrideSendViaTransport(async () => ({ providerMessageId: 'prov-1', providerResponse: { ok: true } }));
  } else {
    // @ts-ignore
    transport.sendViaTransport = async () => ({ providerMessageId: 'prov-1', providerResponse: { ok: true } });
  }

  const events: any[] = [];
  const io = { emit: (evt: string, payload: unknown) => events.push({ evt, payload }) } as any;

  await processSmsJob(job, io);

  assert.ok(updatedBefore, 'Message update before send not called');
  assert.equal(updatedAfter.data.status, 'SENT');
  assert.equal(events.find((e) => e.evt === 'sms:sent')?.payload?.providerMessageId, 'prov-1');
});
