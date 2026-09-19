import test from 'node:test';
import assert from 'node:assert/strict';
import { processSmsJob, handleJobFailed } from './services/messageQueue';
import { prisma } from './lib/prisma';

test('processSmsJob increments retryCount on transient error', async () => {
  process.env.LAMIX_MODE = 'production';

  const job: any = {
    id: 'job-rt-1',
    data: {
      messageId: 'msg-rt-1',
      destination: '+200',
      sender: 'SENDER',
      message: 'retry test',
      transport: 'SMPP',
      idempotencyKey: 'msg-rt-1',
    },
    attemptsMade: 0,
    opts: { attempts: 3 },
  };

  const updates: any[] = [];
  // @ts-ignore
  prisma.message.update = async (args: any) => {
    updates.push(args);
    return { id: args.where.id };
  };

  // @ts-ignore
  prisma.messageAttempt.create = async (_: any) => ({ id: 'att-rt-1' });

  const transport = await import('./services/smsTransport');
  if (typeof (transport as any).overrideSendViaTransport === 'function') {
    // @ts-ignore
    transport.overrideSendViaTransport(async () => { throw new Error('transient network error'); });
  } else {
    // Fallback: replace smpp manager
    const smpp = await import('./services/smpp');
    // @ts-ignore
    smpp.smppManager.sendMessage = async () => { throw new Error('transient network error'); };
  }

  const io = { emit: (_evt: string, _payload: unknown) => {} } as any;

  let threw = false;
  try {
    await processSmsJob(job, io);
  } catch (err) {
    threw = true;
  }

  assert.ok(threw, 'processSmsJob should throw on transient error');
  // Expect second update to set RETRYING
  const retryUpdate = updates.find((u) => u.data && u.data.status === 'RETRYING');
  assert.ok(retryUpdate, 'Retry update not found');
  assert.equal(retryUpdate.data.retryCount, 1);
});

test('handleJobFailed enqueues DLQ when attempts exhausted', async () => {
  const job: any = {
    id: 'job-dlq-1',
    data: { messageId: 'msg-dlq-1' },
    attemptsMade: 3,
    opts: { attempts: 3 },
  };

  let dlqCalled = false;
  const mq = await import('./services/messageQueue');
  if (typeof (mq as any).setDeadLetterQueue === 'function') {
    (mq as any).setDeadLetterQueue({ add: async (_name: string, _data: any, _opts?: any) => { dlqCalled = true; return { id: 'dlq-1' }; } } as any);
  } else {
    // @ts-ignore
    mq.deadLetterQueue = { add: async (_name: string, _data: any, _opts?: any) => { dlqCalled = true; return { id: 'dlq-1' }; } };
  }

  await handleJobFailed(job, new Error('final failure'));
  assert.ok(dlqCalled, 'Dead letter queue was not called when attempts exhausted');
});
