import { logger } from '../utils/logger';
import { isProductionMode } from '../config/mode';
import type { IntegrationTestStatus } from './smpp';

export function hasHttpConfig(): boolean {
  const url = process.env.LAMIX_HTTP_URL?.trim();
  const token = process.env.LAMIX_HTTP_TOKEN?.trim();
  return !!(url && token);
}

export async function testHttpConnection(): Promise<{
  status: IntegrationTestStatus;
  latencyMs?: number;
  message: string;
}> {
  if (!hasHttpConfig()) {
    return {
      status: 'NOT_CONFIGURED',
      message: 'Set LAMIX_HTTP_URL and LAMIX_HTTP_TOKEN',
    };
  }

  if (!isProductionMode()) {
    return {
      status: 'NOT_CONFIGURED',
      message: 'Enable LAMIX_MODE=production to test HTTP integration',
    };
  }

  const url = process.env.LAMIX_HTTP_URL!.trim();
  const token = process.env.LAMIX_HTTP_TOKEN!.trim();
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      return { status: 'AUTH_FAILED', message: 'HTTP API rejected credentials' };
    }

    if (response.ok || response.status === 404 || response.status === 405) {
      return {
        status: 'CONNECTED',
        latencyMs: Date.now() - start,
        message: 'HTTP endpoint reachable with configured token',
      };
    }

    return {
      status: 'PROVIDER_ERROR',
      message: `HTTP API returned status ${response.status}`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    if (msg.includes('abort')) {
      return { status: 'TIMEOUT', message: 'HTTP connection timed out' };
    }
    if (msg.includes('ECONNREFUSED')) {
      return { status: 'CONNECTION_REFUSED', message: 'Could not connect to HTTP URL' };
    }
    return { status: 'PROVIDER_ERROR', message: msg };
  } finally {
    clearTimeout(timeout);
  }
}

export interface HttpSendPayload {
  messageId: string;
  destination: string;
  sender: string;
  message: string;
}

/**
 * Sends SMS via configured HTTP URL. Payload uses generic field names;
 * confirm the exact Lamix HTTP contract with your provider documentation.
 */
export async function sendHttpMessage(
  payload: HttpSendPayload
): Promise<{ providerMessageId: string; response: unknown }> {
  return sendHttpMessageImpl(payload);
}

let sendHttpMessageImpl = async (payload: HttpSendPayload) => {
  if (!hasHttpConfig()) {
    throw new Error('HTTP transport not configured');
  }
  if (!isProductionMode()) {
    throw new Error('HTTP sending requires LAMIX_MODE=production');
  }

  const url = process.env.LAMIX_HTTP_URL!.trim();
  const token = process.env.LAMIX_HTTP_TOKEN!.trim();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const body = {
      destination: payload.destination,
      sender: payload.sender,
      message: payload.message,
      client_reference: payload.messageId,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* plain text response */
    }

    if (!response.ok) {
      throw new Error(`HTTP send failed with status ${response.status}`);
    }

    const providerMessageId =
      typeof parsed === 'object' &&
      parsed !== null &&
      'message_id' in parsed &&
      typeof (parsed as { message_id: unknown }).message_id === 'string'
        ? (parsed as { message_id: string }).message_id
        : payload.messageId;

    logger.info('HTTP SMS accepted by provider', {
      service: 'http',
      event: 'send_success',
      messageId: payload.messageId,
      providerMessageId,
    });

    return { providerMessageId, response: parsed };
  } finally {
    clearTimeout(timeout);
  }
};

export function overrideSendHttpMessage(fn: (payload: HttpSendPayload) => Promise<{ providerMessageId: string; response: unknown }>) {
  sendHttpMessageImpl = fn;
}
