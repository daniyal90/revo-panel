import test from 'node:test';
import assert from 'node:assert/strict';
import { processSmsJob } from './services/messageQueue';
import { prisma } from './lib/prisma';

test('stalled-job recovery does not resend if message already SENT', async () => {
  process.env.LAMIX_MODE = 'production';

  const job: any = {
    id: 'job-stalled-1',
    data: {
      messageId: 'msg-stalled-1',
      destination: '+400',
      sender: 'SND',
      message: 'stalled',
      transport: 'SMPP',
      idempotencyKey: 'msg-stalled-1',
    },
    attemptsMade: 1,
    opts: { attempts: 3 },
  };

  // Simulate existing message already SENT
  // @ts-ignore
  prisma.message.findUnique = async (_: any) => ({ status: 'SENT' });

  let sendCalled = false;
  const transport = await import('./services/smsTransport');
  if (typeof (transport as any).overrideSendViaTransport === 'function') {
    // @ts-ignore
    transport.overrideSendViaTransport(async () => { sendCalled = true; return { providerMessageId: 'x', providerResponse: {} }; });
  } else {
    // @ts-ignore
    transport.sendViaTransport = async () => { sendCalled = true; return { providerMessageId: 'x' , providerResponse: {} }; };
  }

  await processSmsJob(job, { emit: () => {} } as any);

  assert.equal(sendCalled, false, 'sendViaTransport should not be called when message already SENT');
});
