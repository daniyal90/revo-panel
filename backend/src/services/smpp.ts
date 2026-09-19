import smpp from 'smpp';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { isProductionMode } from '../config/mode';

// Injectable factory to create SMPP sessions. Tests may override this to provide a fake session.
export type SmppSessionFactoryType = (opts: Record<string, unknown>) => unknown;
let _SmppSessionFactory: SmppSessionFactoryType = (opts: Record<string, unknown>) =>
  (new (smpp as any).Session(opts) as unknown);

export function overrideSmppSessionFactory(factory: SmppSessionFactoryType) {
  _SmppSessionFactory = factory;
}

export function SmppSessionFactory(opts: Record<string, unknown>) {
  return _SmppSessionFactory(opts);
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  BINDING = 'BINDING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR',
}

export type IntegrationTestStatus =
  | 'CONNECTED'
  | 'NOT_CONFIGURED'
  | 'AUTH_FAILED'
  | 'TIMEOUT'
  | 'CONNECTION_REFUSED'
  | 'PROVIDER_ERROR'
  | 'DISCONNECTED';

export interface SMPPConfig {
  host: string;
  port: number;
  systemId: string;
  password: string;
  systemType: string;
  sourceTon: number;
  sourceNpi: number;
  destTon: number;
  destNpi: number;
  tls: boolean;
}

export interface SMPPMessage {
  id: string;
  destination: string;
  source: string;
  message: string;
  registeredDelivery?: number;
}

const BIND_TIMEOUT_MS = parseInt(process.env.LAMIX_SMPP_BIND_TIMEOUT_MS || '30000', 10);
const CONNECT_TIMEOUT_MS = parseInt(process.env.LAMIX_SMPP_CONNECT_TIMEOUT_MS || '30000', 10);
const ENQUIRE_LINK_INTERVAL_MS = parseInt(process.env.LAMIX_SMPP_ENQUIRE_LINK_MS || '60000', 10);
const MAX_RECONNECT_ATTEMPTS = parseInt(process.env.LAMIX_SMPP_MAX_RECONNECT_ATTEMPTS || '0', 10) || Infinity;
const BASE_RECONNECT_DELAY_MS = parseInt(process.env.LAMIX_SMPP_RECONNECT_BASE_MS || '5000', 10);
const MAX_RECONNECT_DELAY_MS = parseInt(process.env.LAMIX_SMPP_RECONNECT_MAX_MS || '60000', 10);

function commandStatusLabel(status: number): string {
  if (status === 0) return 'OK';
  if (status === 0x0000000d) return 'AUTH_FAILED';
  return `PROVIDER_ERROR_${status}`;
}

export class SMPPManager extends EventEmitter {
  private session: smpp.Session | null = null;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private config: SMPPConfig | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private enquireLinkTimer: NodeJS.Timeout | null = null;
  private connectInFlight: Promise<void> | null = null;
  private shuttingDown = false;
  private lastConnectedAt: Date | null = null;
  private lastError: string | null = null;

  constructor() {
    super();
    this.setMaxListeners(20);
    this.on('error', (err: Error) => {
      logger.error('SMPP manager error event', {
        service: 'smpp',
        event: 'manager_error',
        message: err.message,
      });
    });
  }

  hasValidConfig(): boolean {
    const host = process.env.LAMIX_SMPP_HOST?.trim();
    const port = process.env.LAMIX_SMPP_PORT?.trim();
    const systemId = process.env.LAMIX_SMPP_SYSTEM_ID?.trim();
    const password = process.env.LAMIX_SMPP_PASSWORD?.trim();
    return !!(host && port && systemId && password);
  }

  getConfig(): SMPPConfig | null {
    if (!this.hasValidConfig()) {
      return null;
    }

    return {
      host: process.env.LAMIX_SMPP_HOST!.trim(),
      port: parseInt(process.env.LAMIX_SMPP_PORT!, 10),
      systemId: process.env.LAMIX_SMPP_SYSTEM_ID!.trim(),
      password: process.env.LAMIX_SMPP_PASSWORD!.trim(),
      systemType: process.env.LAMIX_SMPP_SYSTEM_TYPE?.trim() || '',
      sourceTon: parseInt(process.env.LAMIX_SMPP_SOURCE_TON || '0', 10),
      sourceNpi: parseInt(process.env.LAMIX_SMPP_SOURCE_NPI || '1', 10),
      destTon: parseInt(process.env.LAMIX_SMPP_DEST_TON || '1', 10),
      destNpi: parseInt(process.env.LAMIX_SMPP_DEST_NPI || '1', 10),
      tls: process.env.LAMIX_SMPP_TLS === 'true',
    };
  }

  getState(): ConnectionState {
    return this.state;
  }

  getLastConnectedAt(): Date | null {
    return this.lastConnectedAt;
  }

  getLastError(): string | null {
    return this.lastError;
  }

  async connect(): Promise<void> {
    if (!isProductionMode()) {
      throw new Error('SMPP is only available when LAMIX_MODE=production');
    }

    if (this.connectInFlight) {
      return this.connectInFlight;
    }

    this.connectInFlight = this.doConnect();
    try {
      await this.connectInFlight;
    } finally {
      this.connectInFlight = null;
    }
  }

  private async doConnect(): Promise<void> {
    if (this.shuttingDown) {
      return;
    }

    this.config = this.getConfig();
    if (!this.config) {
      this.lastError = 'SMPP not configured';
      this.setState(ConnectionState.DISCONNECTED);
      throw new Error('SMPP not configured — set LAMIX_SMPP_* environment variables');
    }

    if (
      this.state === ConnectionState.CONNECTED ||
      this.state === ConnectionState.CONNECTING ||
      this.state === ConnectionState.BINDING
    ) {
      return;
    }

    this.setState(ConnectionState.CONNECTING);
    this.clearReconnectTimer();
    this.stopEnquireLink();

    try {
      logger.info('Connecting to SMPP server', {
        service: 'smpp',
        event: 'connecting',
        host: this.config.host,
        port: this.config.port,
        tls: this.config.tls,
      });

      // Use injectable session factory to allow testing with mocked sessions
      // Default factory creates a real smpp.Session
      this.session = SmppSessionFactory({
        host: this.config.host,
        port: this.config.port,
        autoConnect: false,
        tls: this.config.tls,
      }) as unknown as smpp.Session;

      this.setupEventHandlers();

      this.connectionTimeout = setTimeout(() => {
        if (this.state === ConnectionState.CONNECTING || this.state === ConnectionState.BINDING) {
          this.lastError = 'Connection timeout';
          this.handleConnectionError(new Error('Connection timeout'));
        }
      }, CONNECT_TIMEOUT_MS);

      await new Promise<void>((resolve, reject) => {
        const session = this.session!;
        session.connect(() => {
          this.setState(ConnectionState.BINDING);
          const bindTimeout = setTimeout(() => {
            reject(new Error('Bind timeout'));
          }, BIND_TIMEOUT_MS);

          session.bind_transceiver(
            {
              system_id: this.config!.systemId,
              password: this.config!.password,
              system_type: this.config!.systemType,
              interface_version: 0x34,
              addr_ton: this.config!.sourceTon,
              addr_npi: this.config!.sourceNpi,
            },
            (pdu: { command_status: number }) => {
              clearTimeout(bindTimeout);
              if (pdu.command_status === 0) {
                logger.info('SMPP bind_transceiver successful', {
                  service: 'smpp',
                  event: 'bind_success',
                });
                this.setState(ConnectionState.CONNECTED);
                this.reconnectAttempts = 0;
                this.lastConnectedAt = new Date();
                this.lastError = null;
                this.startEnquireLink();
                resolve();
              } else {
                const label = commandStatusLabel(pdu.command_status);
                const error = `SMPP bind failed: ${label}`;
                this.lastError = error;
                reject(new Error(error));
              }
            }
          );
        });
      });

      this.clearConnectionTimeout();
    } catch (error) {
      this.clearConnectionTimeout();
      this.handleConnectionError(error as Error);
      throw error;
    }
  }

  async testConnection(): Promise<{ status: IntegrationTestStatus; latencyMs?: number; message: string }> {
    if (!this.hasValidConfig()) {
      return { status: 'NOT_CONFIGURED', message: 'Set LAMIX_SMPP_HOST, PORT, SYSTEM_ID, and PASSWORD' };
    }

    if (!isProductionMode()) {
      return { status: 'NOT_CONFIGURED', message: 'Enable LAMIX_MODE=production to test SMPP' };
    }

    const start = Date.now();
    let session: smpp.Session | null = null;

    try {
      const config = this.getConfig()!;
      session = SmppSessionFactory({
        host: config.host,
        port: config.port,
        autoConnect: false,
        tls: config.tls,
      }) as unknown as smpp.Session;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('TIMEOUT')), BIND_TIMEOUT_MS);

        session!.on('error', (err: Error) => {
          clearTimeout(timeout);
          reject(err);
        });

        session!.connect(() => {
          session!.bind_transceiver(
            {
              system_id: config.systemId,
              password: config.password,
              system_type: config.systemType,
              interface_version: 0x34,
              addr_ton: config.sourceTon,
              addr_npi: config.sourceNpi,
            },
            (pdu: { command_status: number }) => {
              clearTimeout(timeout);
              if (pdu.command_status === 0) {
                session!.unbind(() => {
                  session!.close();
                  resolve();
                });
              } else if (pdu.command_status === 0x0000000d) {
                session!.close();
                reject(new Error('AUTH_FAILED'));
              } else {
                session!.close();
                reject(new Error('PROVIDER_ERROR'));
              }
            }
          );
        });
      });

      return {
        status: 'CONNECTED',
        latencyMs: Date.now() - start,
        message: 'SMPP bind_transceiver test succeeded',
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'unknown';
      if (msg === 'TIMEOUT') {
        return { status: 'TIMEOUT', message: 'SMPP connection or bind timed out' };
      }
      if (msg === 'AUTH_FAILED') {
        return { status: 'AUTH_FAILED', message: 'SMPP authentication failed' };
      }
      if (msg.includes('ECONNREFUSED') || msg.includes('connect ECONNREFUSED')) {
        return { status: 'CONNECTION_REFUSED', message: 'Could not connect to SMPP host' };
      }
      if (msg === 'PROVIDER_ERROR') {
        return { status: 'PROVIDER_ERROR', message: 'SMPP provider rejected bind' };
      }
      return { status: 'PROVIDER_ERROR', message: msg };
    } finally {
      if (session) {
        try {
          session.close();
        } catch {
          /* ignore */
        }
      }
    }
  }

  private setupEventHandlers(): void {
    if (!this.session) return;

    this.session.removeAllListeners();

    this.session.on('close', () => {
      if (this.shuttingDown) return;
      logger.warn('SMPP session closed', { service: 'smpp', event: 'session_closed' });
      this.handleConnectionError(new Error('Session closed'));
    });

    this.session.on('error', (error: Error) => {
      logger.error('SMPP session error', {
        service: 'smpp',
        event: 'session_error',
        message: error.message,
      });
      this.handleConnectionError(error);
    });

    this.session.on('deliver_sm', (pdu: Record<string, unknown>) => {
      this.emit('deliver_sm', pdu);
    });
  }

  private startEnquireLink(): void {
    this.stopEnquireLink();
    this.enquireLinkTimer = setInterval(() => {
      if (this.state === ConnectionState.CONNECTED && this.session) {
        this.session.enquire_link((pdu: { command_status: number }) => {
          if (pdu.command_status !== 0) {
            logger.warn('SMPP enquire_link failed', {
              service: 'smpp',
              event: 'enquire_link_failed',
              errorCode: pdu.command_status,
            });
          }
        });
      }
    }, ENQUIRE_LINK_INTERVAL_MS);
  }

  private stopEnquireLink(): void {
    if (this.enquireLinkTimer) {
      clearInterval(this.enquireLinkTimer);
      this.enquireLinkTimer = null;
    }
  }

  private handleConnectionError(error: Error): void {
    if (this.shuttingDown) return;

    this.lastError = error.message;
    this.stopEnquireLink();

    if (this.session) {
      try {
        this.session.removeAllListeners();
        this.session.close();
      } catch {
        /* ignore */
      }
      this.session = null;
    }

    if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      this.setState(ConnectionState.RECONNECTING);
      this.reconnectAttempts++;
      const delay = Math.min(
        BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1),
        MAX_RECONNECT_DELAY_MS
      );
      logger.info('Scheduling SMPP reconnect', {
        service: 'smpp',
        event: 'reconnect_scheduled',
        retryCount: this.reconnectAttempts,
        delayMs: delay,
      });
      this.reconnectTimer = setTimeout(() => {
        this.connect().catch((err) => {
          logger.error('SMPP reconnect failed', {
            service: 'smpp',
            event: 'reconnect_failed',
            message: err instanceof Error ? err.message : 'unknown',
          });
        });
      }, delay);
    } else {
      this.setState(ConnectionState.ERROR);
      logger.error('SMPP max reconnect attempts reached', {
        service: 'smpp',
        event: 'reconnect_exhausted',
      });
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  private setState(newState: ConnectionState): void {
    const oldState = this.state;
    this.state = newState;
    if (oldState !== newState) {
      logger.info('SMPP state changed', {
        service: 'smpp',
        event: 'state_change',
        from: oldState,
        to: newState,
      });
      this.emit('stateChange', newState);
    }
  }

  async sendMessage(message: SMPPMessage): Promise<{ messageId: string; response: Record<string, unknown> }> {
    if (!isProductionMode()) {
      throw new Error('SMS sending requires LAMIX_MODE=production');
    }

    if (this.state !== ConnectionState.CONNECTED || !this.session) {
      await this.connect();
    }

    if (this.state !== ConnectionState.CONNECTED || !this.session || !this.config) {
      throw new Error('SMPP not connected');
    }

    return new Promise((resolve, reject) => {
      this.session!.submit_sm(
        {
          source_addr: message.source,
          destination_addr: message.destination,
          short_message: message.message,
          source_addr_ton: this.config!.sourceTon,
          source_addr_npi: this.config!.sourceNpi,
          dest_addr_ton: this.config!.destTon,
          dest_addr_npi: this.config!.destNpi,
          registered_delivery: message.registeredDelivery ?? 1,
        },
        (pdu: { command_status: number; message_id?: string }) => {
          if (pdu.command_status === 0 && pdu.message_id) {
            logger.info('SMS submit_sm accepted', {
              service: 'smpp',
              event: 'submit_sm_success',
              messageId: message.id,
              providerMessageId: pdu.message_id,
            });
            resolve({
              messageId: pdu.message_id,
              response: { command_status: pdu.command_status, message_id: pdu.message_id },
            });
          } else {
            const error = `SMS submit failed: ${commandStatusLabel(pdu.command_status)}`;
            logger.error(error, {
              service: 'smpp',
              event: 'submit_sm_failed',
              messageId: message.id,
              errorCode: pdu.command_status,
            });
            reject(new Error(error));
          }
        }
      );
    });
  }

  async disconnect(): Promise<void> {
    this.shuttingDown = true;
    this.clearReconnectTimer();
    this.clearConnectionTimeout();
    this.stopEnquireLink();

    if (this.session && this.state === ConnectionState.CONNECTED) {
      await new Promise<void>((resolve) => {
        this.session!.unbind(() => {
          this.session!.close();
          this.session = null;
          this.setState(ConnectionState.DISCONNECTED);
          resolve();
        });
      });
    } else if (this.session) {
      this.session.close();
      this.session = null;
      this.setState(ConnectionState.DISCONNECTED);
    }
  }

  isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED && this.session !== null;
  }
}

export const smppManager = new SMPPManager();
