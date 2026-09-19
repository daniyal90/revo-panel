import { smppManager } from './smpp';
import { hasHttpConfig, sendHttpMessage } from './httpTransport';
import { isProductionMode } from '../config/mode';

export type SmsTransport = 'SMPP' | 'HTTP';

export function resolveTransport(): SmsTransport {
  const preferred = process.env.LAMIX_SMS_TRANSPORT?.toUpperCase();
  if (preferred === 'HTTP' && hasHttpConfig()) return 'HTTP';
  if (preferred === 'SMPP' && smppManager.hasValidConfig()) return 'SMPP';
  if (smppManager.hasValidConfig()) return 'SMPP';
  if (hasHttpConfig()) return 'HTTP';
  throw new Error('No Lamix transport configured. Set SMPP or HTTP environment variables.');
}

export async function sendViaTransport(params: {
  messageId: string;
  destination: string;
  sender: string;
  message: string;
  transport: SmsTransport;
}): Promise<{ providerMessageId: string; providerResponse: unknown }> {
  return sendViaTransportImpl(params);
}

// Internal implementation that can be overridden in tests
let sendViaTransportImpl = async (params: {
  messageId: string;
  destination: string;
  sender: string;
  message: string;
  transport: SmsTransport;
}): Promise<{ providerMessageId: string; providerResponse: unknown }> => {
  if (!isProductionMode()) {
    throw new Error('Outbound SMS requires LAMIX_MODE=production');
  }

  if (params.transport === 'SMPP') {
    const result = await smppManager.sendMessage({
      id: params.messageId,
      destination: params.destination,
      source: params.sender,
      message: params.message,
      registeredDelivery: 1,
    });
    return { providerMessageId: result.messageId, providerResponse: result.response };
  }

  const httpResult = await sendHttpMessage({
    messageId: params.messageId,
    destination: params.destination,
    sender: params.sender,
    message: params.message,
  });
  return {
    providerMessageId: httpResult.providerMessageId,
    providerResponse: httpResult.response,
  };
};

export function overrideSendViaTransport(
  fn: (params: {
    messageId: string;
    destination: string;
    sender: string;
    message: string;
    transport: SmsTransport;
  }) => Promise<{ providerMessageId: string; providerResponse: unknown }>
) {
  sendViaTransportImpl = fn;
}

export function isPermanentProviderError(message: string): boolean {
  const permanent = ['AUTH_FAILED', 'bind failed', 'invalid destination', 'invalid source'];
  return permanent.some((p) => message.toLowerCase().includes(p.toLowerCase()));
}
