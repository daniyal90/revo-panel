import Redis from 'ioredis';
import { smppManager, ConnectionState } from './smpp';
import { hasHttpConfig } from './httpTransport';
import { checkDatabaseConnection } from '../lib/prisma';
import { isDemoMode, isProductionMode } from '../config/mode';
import { smsQueue } from './messageQueue';

export type ServiceStatus =
  | 'CONNECTED'
  | 'NOT_CONFIGURED'
  | 'AUTH_FAILED'
  | 'TIMEOUT'
  | 'CONNECTION_REFUSED'
  | 'PROVIDER_ERROR'
  | 'DISCONNECTED'
  | 'ERROR';

function mapSmppState(state: ConnectionState): ServiceStatus {
  switch (state) {
    case ConnectionState.CONNECTED:
      return 'CONNECTED';
    case ConnectionState.CONNECTING:
    case ConnectionState.BINDING:
    case ConnectionState.RECONNECTING:
      return 'DISCONNECTED';
    case ConnectionState.ERROR:
      return 'ERROR';
    default:
      return 'DISCONNECTED';
  }
}

export async function getRedisConnection(): Promise<Redis> {
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    lazyConnect: true,
  });
}

export async function checkRedisStatus(): Promise<ServiceStatus> {
  const redis = await getRedisConnection();
  try {
    await redis.connect();
    await redis.ping();
    return 'CONNECTED';
  } catch {
    return 'DISCONNECTED';
  } finally {
    redis.disconnect();
  }
}

export async function getIntegrationStatus() {
  if (isDemoMode()) {
    return {
      mode: 'demo' as const,
      smpp: { status: 'CONNECTED' as ServiceStatus, connectedAt: new Date().toISOString() },
      http: { status: 'CONNECTED' as ServiceStatus, connectedAt: new Date().toISOString() },
      database: { status: 'CONNECTED' as ServiceStatus },
      redis: { status: 'CONNECTED' as ServiceStatus },
      queue: { waiting: 0, active: 0, failed: 0 },
    };
  }

  const [dbOk, redisStatus] = await Promise.all([
    checkDatabaseConnection(),
    checkRedisStatus(),
  ]);

  let smppStatus: ServiceStatus = 'NOT_CONFIGURED';
  let smppConnectedAt: string | undefined;

  if (isProductionMode()) {
    if (!smppManager.hasValidConfig()) {
      smppStatus = 'NOT_CONFIGURED';
    } else {
      smppStatus = mapSmppState(smppManager.getState());
      const connectedAt = smppManager.getLastConnectedAt();
      if (connectedAt) smppConnectedAt = connectedAt.toISOString();
    }
  } else {
    smppStatus = smppManager.hasValidConfig() ? 'DISCONNECTED' : 'NOT_CONFIGURED';
  }

  const httpStatus: ServiceStatus = hasHttpConfig()
    ? isProductionMode()
      ? 'DISCONNECTED'
      : 'NOT_CONFIGURED'
    : 'NOT_CONFIGURED';

  let queueStats = { waiting: 0, active: 0, failed: 0 };
  if (smsQueue) {
    const [waiting, active, failed] = await Promise.all([
      smsQueue.getWaitingCount(),
      smsQueue.getActiveCount(),
      smsQueue.getFailedCount(),
    ]);
    queueStats = { waiting, active, failed };
  }

  return {
    mode: isProductionMode() ? ('production' as const) : ('development' as const),
    smpp: {
      status: smppStatus,
      state: smppManager.getState(),
      connectedAt: smppConnectedAt,
      // IMPORTANT: do not expose raw provider error messages or secrets in API responses.
      // Only indicate presence of a recent error to the dashboard; full details remain in server logs.
      lastError: smppManager.getLastError() ? 'ERROR_REPORTED' : undefined,
      isConfigured: smppManager.hasValidConfig(),
    },
    http: {
      status: httpStatus,
      isConfigured: hasHttpConfig(),
    },
    database: { status: dbOk ? ('CONNECTED' as ServiceStatus) : ('DISCONNECTED' as ServiceStatus) },
    redis: { status: redisStatus },
    queue: queueStats,
  };
}

export function getSmppPublicConfig() {
  return {
    host: process.env.LAMIX_SMPP_HOST ? '***configured***' : '',
    port: process.env.LAMIX_SMPP_PORT ? parseInt(process.env.LAMIX_SMPP_PORT, 10) : 2775,
    systemId: process.env.LAMIX_SMPP_SYSTEM_ID ? '***configured***' : '',
    systemType: process.env.LAMIX_SMPP_SYSTEM_TYPE || '',
    ton: parseInt(process.env.LAMIX_SMPP_SOURCE_TON || '0', 10),
    npi: parseInt(process.env.LAMIX_SMPP_SOURCE_NPI || '1', 10),
    tls: process.env.LAMIX_SMPP_TLS === 'true',
    isConfigured: smppManager.hasValidConfig(),
    setupMessage: smppManager.hasValidConfig()
      ? undefined
      : 'Set LAMIX_SMPP_HOST, LAMIX_SMPP_PORT, LAMIX_SMPP_SYSTEM_ID, and LAMIX_SMPP_PASSWORD in environment variables.',
  };
}

export function getHttpPublicConfig() {
  return {
    endpoint: process.env.LAMIX_HTTP_URL ? '***configured***' : '',
    apiKey: process.env.LAMIX_HTTP_TOKEN ? '***configured***' : '',
    isConfigured: hasHttpConfig(),
    setupMessage: hasHttpConfig()
      ? undefined
      : 'Set LAMIX_HTTP_URL and LAMIX_HTTP_TOKEN. Confirm the official Lamix HTTP request/response contract with your provider.',
  };
}
