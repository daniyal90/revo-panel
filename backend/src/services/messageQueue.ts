import { Queue, Worker, Job } from 'bullmq';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';
import Redis from 'ioredis';
import { prisma } from '../lib/prisma';
import { isDemoMode } from '../config/mode';
import { sendViaTransport, isPermanentProviderError } from './smsTransport';

console.log('MODULE LOAD: messageQueue');

// For test environments, avoid creating a real Redis connection which can
// produce async errors or open handles that interfere with the test runner.
let connection: any;
if (process.env.NODE_ENV === 'test') {
  console.log('TEST: using fake Redis connection');
  connection = {
    on: () => {},
    disconnect: async () => {},
  } as any;
} else {
  connection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    maxRetriesPerRequest: null,
  });

  connection.on('error', (err: Error) => {
    logger.error('Redis connection error', {
      service: 'redis',
      event: 'connection_error',
      message: err.message,
    });
  });
}

export let smsQueue: Queue | undefined;
export let smsWorker: Worker | undefined;
export let deadLetterQueue: Queue | undefined;

// Testing helper to allow tests to inject a fake DLQ without relying on
// assigning to the module namespace (which is read-only in ESM).
export function setDeadLetterQueue(q: Queue | undefined) {
  deadLetterQueue = q;
}

const QUEUE_NAME = 'sms-queue';
const DLQ_NAME = 'sms-dead-letter';
const WORKER_CONCURRENCY = parseInt(process.env.SMS_QUEUE_CONCURRENCY || '5', 10);
const RATE_LIMIT_MAX = parseInt(process.env.SMS_RATE_LIMIT_MAX || '30', 10);
const RATE_LIMIT_DURATION_MS = parseInt(process.env.SMS_RATE_LIMIT_DURATION_MS || '1000', 10);

export interface SmsJobData {
  messageId: string;
  destination: string;
  sender: string;
  message: string;
  transport: 'SMPP' | 'HTTP';
  idempotencyKey: string;
}

export async function handleJobFailed(job: Job<SmsJobData> | undefined, err: Error) {
  logger.error('SMS job failed', {
    service: 'queue',
    event: 'job_failed',
    jobId: job?.id,
    messageId: job?.data?.messageId,
    message: err.message,
    retryCount: job?.attemptsMade,
  });

  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    try {
      await deadLetterQueue?.add('dead-letter', job.data, { jobId: `dlq-${job.data.messageId}` });
    } catch {
      // ignore dlq failures in handler
    }
  }
}

export async function processSmsJob(job: Job<SmsJobData>, io: SocketIOServer) {
  const { messageId, destination, transport } = job.data;
  const attemptNumber = job.attemptsMade + 1;

  logger.info('Processing SMS job', {
    service: 'queue',
    event: 'job_processing',
    messageId,
    jobId: job.id,
    retryCount: job.attemptsMade,
  });

  if (process.env.NODE_ENV === 'test') {
    logger.info('TEST LOG: processSmsJob start', { messageId, attemptsMade: job.attemptsMade });
  }

  if (isDemoMode()) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const success = Math.random() > 0.1;
    if (success) {
      await prisma.message.update({
        where: { id: messageId },
        data: { status: 'DELIVERED', deliveredAt: new Date() },
      });
      io.emit('sms:delivered', { messageId, destination, status: 'DELIVERED' });
    } else {
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          errorCode: 'DEMO_ERROR',
          errorMessage: 'Demo mode simulated failure',
        },
      });
      io.emit('sms:failed', { messageId, destination, status: 'FAILED' });
    }
    return;
  }

  await prisma.message.update({
    where: { id: messageId },
    data: {
      status: job.attemptsMade > 0 ? 'RETRYING' : 'SUBMITTED',
      retryCount: job.attemptsMade,
      submittedAt: new Date(),
    },
  });

  // If this is a stalled-job recovery (attemptsMade > 0) we should check the
  // current message status to avoid resending already-delivered messages.
  try {
    const existing = await prisma.message.findUnique({ where: { id: messageId } });
    if (existing && (existing as any).status === 'SENT') {
      logger.info('Skipping stalled job: message already SENT', { service: 'queue', event: 'stalled_skip', messageId });
      return;
    }
  } catch (err) {
    // If findUnique fails (e.g., no DB), continue and let send proceed — the
    // tests stub findUnique to control behavior.
  }

  try {
    if (process.env.NODE_ENV === 'test') logger.info('TEST LOG: calling sendViaTransport', { messageId }); // noop
    const result = await sendViaTransport({
      messageId,
      destination: job.data.destination,
      sender: job.data.sender,
      message: job.data.message,
      transport,
    });

    if (process.env.NODE_ENV === 'test') logger.info('TEST LOG: sendViaTransport returned', { messageId, providerMessageId: (result as any)?.providerMessageId });

    await recordAttempt(messageId, attemptNumber, 'SENT', undefined, undefined, result.providerResponse);

    await prisma.message.update({
      where: { id: messageId },
      data: {
        status: 'SENT',
        providerMessageId: result.providerMessageId,
        providerResponse: result.providerResponse as object,
        externalId: result.providerMessageId,
      },
    });

    io.emit('sms:sent', {
      messageId,
      destination,
      status: 'SENT',
      providerMessageId: result.providerMessageId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (process.env.NODE_ENV === 'test') logger.info('TEST LOG: sendViaTransport threw', { messageId, errorMessage });
    await recordAttempt(messageId, attemptNumber, 'FAILED', 'SEND_ERROR', errorMessage);

    if (isPermanentProviderError(errorMessage)) {
      if (process.env.NODE_ENV === 'test') logger.info('TEST LOG: detected permanent error', { messageId, errorMessage });
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          errorCode: 'PERMANENT',
          errorMessage,
          retryCount: job.attemptsMade,
        },
      });
      if (process.env.NODE_ENV === 'test') logger.info('TEST LOG: message marked FAILED', { messageId });
      io.emit('sms:failed', { messageId, destination, status: 'FAILED' });
      if (process.env.NODE_ENV === 'test') logger.info('TEST LOG: calling deadLetterQueue.add', { messageId, dlqPresent: !!deadLetterQueue });
      await deadLetterQueue!.add('dead-letter', job.data, { jobId: `dlq-${messageId}` });
      if (process.env.NODE_ENV === 'test') logger.info('TEST LOG: deadLetterQueue.add completed', { messageId });
      return;
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        status: 'RETRYING',
        errorMessage,
        retryCount: job.attemptsMade + 1,
      },
    });

    throw error;
  }
}

async function recordAttempt(
  messageId: string,
  attemptNumber: number,
  status: string,
  errorCode?: string,
  errorMessage?: string,
  providerResponse?: unknown
) {
  await prisma.messageAttempt.create({
    data: {
      messageId,
      attemptNumber,
      status,
      errorCode,
      errorMessage,
      providerResponse: providerResponse as object | undefined,
    },
  });
}

export function initializeQueue(io: SocketIOServer) {
  smsQueue = new Queue(QUEUE_NAME, { connection });
  deadLetterQueue = new Queue(DLQ_NAME, { connection });
  // Create worker that uses exported processSmsJob function so it can be unit-tested directly
  smsWorker = new Worker(
    QUEUE_NAME,
    async (job: Job<SmsJobData>) => await processSmsJob(job, io),
    {
      connection,
      concurrency: WORKER_CONCURRENCY,
      limiter: {
        max: RATE_LIMIT_MAX,
        duration: RATE_LIMIT_DURATION_MS,
      },
    }
  );

  smsWorker.on('completed', (job) => {
    logger.info('SMS job completed', { service: 'queue', event: 'job_completed', jobId: job.id });
  });

  smsWorker.on('failed', (job, err) => {
    handleJobFailed(job, err as Error).catch(() => {});
  });

  smsWorker.on('error', (err) => {
    logger.error('SMS worker error', { service: 'queue', event: 'worker_error', message: err.message });
  });

  logger.info('Message queue initialized', { service: 'queue', event: 'initialized' });
}

export async function addSmsToQueue(data: SmsJobData) {
  if (!smsQueue) {
    throw new Error('SMS queue not initialized');
  }

  const job = await smsQueue.add('send-sms', data, {
    jobId: data.idempotencyKey,
    attempts: parseInt(process.env.SMS_QUEUE_MAX_ATTEMPTS || '5', 10),
    backoff: {
      type: 'exponential',
      delay: parseInt(process.env.SMS_QUEUE_BACKOFF_MS || '2000', 10),
    },
    removeOnComplete: 1000,
    removeOnFail: false,
  });

  logger.info('SMS added to queue', {
    service: 'queue',
    event: 'job_enqueued',
    jobId: job.id,
    messageId: data.messageId,
  });
  return job;
}

export async function shutdownQueue(): Promise<void> {
  if (smsWorker) {
    await smsWorker.close();
  }
  if (smsQueue) {
    await smsQueue.close();
  }
  if (deadLetterQueue) {
    await deadLetterQueue.close();
  }
  connection.disconnect();
}
