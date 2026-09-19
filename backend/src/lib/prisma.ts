import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const globalForPrisma = globalThis as unknown as { prisma?: any };

let _prisma: any;
// In test environments, avoid instantiating a real PrismaClient which may
// attempt to connect to a database. Instead return a lightweight in-memory
// stub that tests can override as needed.
if (process.env.NODE_ENV === 'test') {
  logger.warn('Using in-memory Prisma stub for test environment', {
    service: 'database',
    event: 'prisma_test_stub',
  });

  _prisma = {
    // Minimal stubs used by unit tests. Tests can override these methods.
    message: { update: async () => ({}), findUnique: async () => null },
    messageAttempt: { create: async () => ({}) },
    inboundMessage: { create: async () => ({}) },
    providerEvent: { create: async () => ({}) },
    number: { findFirst: async () => null },
    earningRecord: { create: async () => ({}) },
    deliveryReceipt: { create: async () => ({}) },
    $queryRaw: async () => { throw new Error('Prisma client not available'); },
  };
} else {
  try {
    _prisma =
      globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      });

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = _prisma;
    }
  } catch (err) {
    // Fallback for environments where prisma client cannot be initialized.
    logger.warn('Prisma client initialization failed, using in-memory stub', {
      service: 'database',
      event: 'prisma_init_failed',
      message: err instanceof Error ? err.message : String(err),
    });

    _prisma = {
      // Minimal stubs used by unit tests. Tests can override these methods.
      message: { update: async () => ({}), findUnique: async () => null },
      messageAttempt: { create: async () => ({}) },
      inboundMessage: { create: async () => ({}) },
      providerEvent: { create: async () => ({}) },
      number: { findFirst: async () => null },
      earningRecord: { create: async () => ({}) },
      deliveryReceipt: { create: async () => ({}) },
      $queryRaw: async () => { throw new Error('Prisma client not available'); },
    };
  }
}

export const prisma = _prisma;

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed', {
      service: 'database',
      event: 'health_check_failed',
      error: error instanceof Error ? error.message : 'unknown',
    });
    return false;
  }
}
