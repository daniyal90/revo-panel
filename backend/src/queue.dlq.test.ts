import test from 'node:test';
import assert from 'node:assert/strict';

// Ensure test environment is set before importing code that initializes Prisma.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

process.on('uncaughtException', (err) => {
  console.error('TEST UNCAUGHT EXCEPTION', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('TEST UNHANDLED REJECTION', reason);
});

test('processSmsJob moves permanent error to DLQ and marks message FAILED', async () => {
  process.env.LAMIX_MODE = 'production';
  // Ensure test-mode logging in messageQueue (already set at module load)
  process.env.NODE_ENV = 'test';

  // Import prisma after NODE_ENV is set so lib/prisma returns the test stub.
  const { prisma } = await import('./lib/prisma');

  // Ensure a Message record exists matching the job.messageId to avoid FK errors
  // when the real Prisma client is used. If using the test stub, provide a
  // minimal create implementation that returns the data.
  const existingCreate = prisma?.message?.create;
  if (typeof existingCreate !== 'function') {
    // @ts-ignore - tests run in a controlled environment
    prisma.message = prisma.message || {};
    // @ts-ignore
    prisma.message.create = async ({ data }: any) => ({ ...data });
  }

  // Create the message record that will be referenced by MessageAttempt
  await prisma.message.create({
    data: {
      id: 'msg-dlq-2',
      destination: '+300',
      sender: 'SND',
      messageBody: 'perm error',
      messageHash: 'perm-error-hash',
      transport: 'SMPP',
    },
  });

  console.log('TEST: starting DLQ test - installing transport override');

  const job: any = {
    id: 'job-dlq-2',
    data: {
      messageId: 'msg-dlq-2',
      destination: '+300',
      sender: 'SND',
      message: 'perm error',
      transport: 'SMPP',
      idempotencyKey: 'msg-dlq-2',
    },
    attemptsMade: 0,
    opts: { attempts: 2 },
  };

  const updates: any[] = [];
  // @ts-ignore
  prisma.message.update = async (args: any) => {
    updates.push(args);
    return { id: args.where.id };
  };


  // Override sendViaTransport to throw permanent error BEFORE importing messageQueue
  const transport = await import('./services/smsTransport');
  if (typeof (transport as any).overrideSendViaTransport === 'function') {
    // @ts-ignore
    transport.overrideSendViaTransport(async (_params: any) => {
      throw new Error('AUTH_FAILED');
    });
    console.log('TEST: overrideSendViaTransport installed');
  } else {
    // Fallback: stub smppManager if override not available
    const smpp = await import('./services/smpp');
    // @ts-ignore
    smpp.smppManager.sendMessage = async () => {
      throw new Error('AUTH_FAILED');
    };
    console.log('TEST: fallback smppManager.sendMessage stub installed');
  }

  let dlqCalled = false;
  const mq = await import('./services/messageQueue');
  // Use exported setter to inject fake DLQ in ESM-safe way
  if (typeof (mq as any).setDeadLetterQueue === 'function') {
    (mq as any).setDeadLetterQueue({ add: async (_name: string, _data: any, _opts?: any) => { dlqCalled = true; return { id: 'dlq-x' }; } } as any);
  } else {
    // Fallback: assign directly (older CommonJS environments)
    // @ts-ignore
    mq.deadLetterQueue = { add: async (_name: string, _data: any, _opts?: any) => { dlqCalled = true; return { id: 'dlq-x' }; } };
  }

  const { processSmsJob } = mq;

  try {
    console.log('TEST: calling processSmsJob');
    await processSmsJob(job, { emit: () => {} } as any);
    console.log('TEST: processSmsJob returned normally');
  } catch (err) {
    console.error('TEST: processSmsJob threw', err);
    throw err;
  }

  // Expect that a message update was made to set status FAILED
  const failedUpdate = updates.find((u) => u.data && u.data.status === 'FAILED');
  assert.ok(failedUpdate, 'Message was not marked FAILED on permanent error');
  assert.ok(dlqCalled, 'Dead letter queue was not called for permanent error');
});
