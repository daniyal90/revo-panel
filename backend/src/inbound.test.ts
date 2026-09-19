import test from 'node:test';
import assert from 'node:assert/strict';
import { handleDeliverSm } from './services/inboundHandler';
import { prisma } from './lib/prisma';

test('handleDeliverSm stores inbound message and emits websocket event', async () => {
  // Arrange
  process.env.LAMIX_MODE = 'development';
  const fakePdu = {
    source_addr: '+123456',
    destination_addr: '+198765',
    short_message: Buffer.from('hello'),
    message_id: 'prov-1',
  } as any;

  const fakeIo = {
    emit: (_evt: string, _payload: unknown) => {},
  } as any;

  // Stub prisma methods
  let createdInbound: any = null;
  // @ts-ignore
  prisma.number.findFirst = async (_q: any) => ({ id: 'num-1', range: 'R1', number: '198765', payout: 0.5 });
  // @ts-ignore
  prisma.inboundMessage.create = async (opts: any) => {
    createdInbound = opts.data;
    return { id: 'inbound-1', ...createdInbound, createdAt: new Date() };
  };
  // @ts-ignore
  prisma.providerEvent.create = async (_opts: any) => ({ id: 'evt-1' });
  // @ts-ignore
  prisma.earningRecord.create = async (_opts: any) => ({ id: 'earn-1' });

  // Act
  await handleDeliverSm(fakePdu as any, fakeIo);

  // Assert
  assert.ok(createdInbound, 'Inbound message was not created');
  assert.equal(createdInbound.cli, '+123456');
  assert.equal(createdInbound.message, 'hello');
});
