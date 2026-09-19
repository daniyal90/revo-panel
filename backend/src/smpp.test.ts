import test from 'node:test';
import assert from 'node:assert/strict';
import { overrideSmppSessionFactory, smppManager } from './services/smpp';

test('smpp.testConnection returns NOT_CONFIGURED when env missing', async () => {
  // Ensure required env vars are unset
  delete process.env.LAMIX_SMPP_HOST;
  delete process.env.LAMIX_SMPP_PORT;
  delete process.env.LAMIX_SMPP_SYSTEM_ID;
  delete process.env.LAMIX_SMPP_PASSWORD;

  const res = await smppManager.testConnection();
  assert.equal(res.status, 'NOT_CONFIGURED');
});

test('smpp.testConnection returns CONNECTED when bind succeeds', async () => {
  process.env.LAMIX_MODE = 'production';
  process.env.LAMIX_SMPP_HOST = '127.0.0.1';
  process.env.LAMIX_SMPP_PORT = '2775';
  process.env.LAMIX_SMPP_SYSTEM_ID = 'test';
  process.env.LAMIX_SMPP_PASSWORD = 'pass';

  // Override session factory with a fake session that simulates successful bind
  overrideSmppSessionFactory((_opts: Record<string, unknown>) => {
    return {
      connect(cb: () => void) {
        setImmediate(cb);
      },
      bind_transceiver(_opts: unknown, cb: (pdu: { command_status: number }) => void) {
        setImmediate(() => cb({ command_status: 0 }));
      },
      unbind(cb: () => void) {
        setImmediate(cb);
      },
      close() {},
      on(_evt: string, _handler: (...args: unknown[]) => void) {},
    } as unknown;
  });

  const res = await smppManager.testConnection();
  assert.equal(res.status, 'CONNECTED');
});

test('smpp.testConnection maps AUTH_FAILED correctly', async () => {
  process.env.LAMIX_MODE = 'production';
  process.env.LAMIX_SMPP_HOST = '127.0.0.1';
  process.env.LAMIX_SMPP_PORT = '2775';
  process.env.LAMIX_SMPP_SYSTEM_ID = 'test';
  process.env.LAMIX_SMPP_PASSWORD = 'pass';

  overrideSmppSessionFactory((_opts: Record<string, unknown>) => {
    return {
      connect(cb: () => void) {
        setImmediate(cb);
      },
      bind_transceiver(_opts: unknown, cb: (pdu: { command_status: number }) => void) {
        setImmediate(() => cb({ command_status: 0x0000000d }));
      },
      close() {},
      on(_evt: string, _handler: (...args: unknown[]) => void) {},
    } as unknown;
  });

  const res = await smppManager.testConnection();
  assert.equal(res.status, 'AUTH_FAILED');
});
