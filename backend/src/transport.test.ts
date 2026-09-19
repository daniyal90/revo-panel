import test from 'node:test';
import assert from 'node:assert/strict';
import * as smsTransport from './services/smsTransport';
import { smppManager } from './services/smpp';
import * as httpTransport from './services/httpTransport';

test('sendViaTransport uses SMPP when requested', async () => {
  process.env.LAMIX_MODE = 'production';

  // Ensure transport resolution will accept SMPP by faking smpp config env
  process.env.LAMIX_SMPP_HOST = '127.0.0.1';
  process.env.LAMIX_SMPP_PORT = '2775';
  process.env.LAMIX_SMPP_SYSTEM_ID = 'id';
  process.env.LAMIX_SMPP_PASSWORD = 'pw';

  // Stub smppManager.sendMessage
  const originalSend = smppManager.sendMessage;
  // @ts-ignore - replace for test
  smppManager.sendMessage = async () => ({ messageId: 'prov-123', response: { ok: true } });

  const result = await smsTransport.sendViaTransport({
    messageId: 'msg-1',
    destination: '+123456789',
    sender: 'LAMIX',
    message: 'hello',
    transport: 'SMPP',
  });

  assert.equal(result.providerMessageId, 'prov-123');

  // restore
  // @ts-ignore
  smppManager.sendMessage = originalSend;
});

test('sendViaTransport uses HTTP when requested', async () => {
  process.env.LAMIX_MODE = 'production';
  process.env.LAMIX_HTTP_URL = 'https://example.test/send';
  process.env.LAMIX_HTTP_TOKEN = 'tok';

  const originalSendHttp = (httpTransport as any).sendHttpMessage;
  // Use override function to inject test stub
  if (typeof (httpTransport as any).overrideSendHttpMessage === 'function') {
    // @ts-ignore
    httpTransport.overrideSendHttpMessage(async () => ({ providerMessageId: 'http-1', response: { ok: true } }));
  } else {
    // fallback (should not happen)
    // @ts-ignore
    httpTransport.sendHttpMessage = async () => ({ providerMessageId: 'http-1', response: { ok: true } });
  }

  const result = await smsTransport.sendViaTransport({
    messageId: 'msg-2',
    destination: '+123456789',
    sender: 'LAMIX',
    message: 'hello http',
    transport: 'HTTP',
  });

  assert.equal(result.providerMessageId, 'http-1');

  // restore
  if (typeof (httpTransport as any).overrideSendHttpMessage === 'function') {
    // @ts-ignore
    httpTransport.overrideSendHttpMessage(originalSendHttp);
  } else {
    // @ts-ignore
    httpTransport.sendHttpMessage = originalSendHttp;
  }
});
