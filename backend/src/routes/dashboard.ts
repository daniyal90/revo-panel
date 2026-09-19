import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { isDemoMode } from '../config/mode';
import { getIntegrationStatus } from '../services/integrationStatus';

const router = Router();

router.get('/stats', authenticate, async (_req: AuthRequest, res, next) => {
  try {
    if (isDemoMode()) {
      res.json({
        totalNumbers: 142,
        activeNumbers: 128,
        smsToday: 8427,
        smsThisWeek: 58234,
        successfulSms: 7891,
        failedSms: 536,
        pendingMessages: 12,
        todaysEarnings: 151.69,
        availableBalance: 0,
        mode: 'demo',
        connectionStatus: {
          lamix: 'CONNECTED',
          smpp: 'CONNECTED',
          http: 'CONNECTED',
          database: 'CONNECTED',
          redis: 'CONNECTED',
          smsProvider: 'CONNECTED',
        },
        queue: { waiting: 0, active: 0, failed: 0 },
      });
      return;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalNumbers,
      activeNumbers,
      smsToday,
      smsThisWeek,
      successfulSms,
      failedSms,
      pendingMessages,
      earningsSum,
      integration,
    ] = await Promise.all([
      prisma.number.count(),
      prisma.number.count({ where: { status: 'ACTIVE' } }),
      prisma.message.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.message.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.message.count({
        where: {
          status: { in: ['SENT', 'DELIVERED'] },
          createdAt: { gte: startOfDay },
        },
      }),
      prisma.message.count({
        where: { status: 'FAILED', createdAt: { gte: startOfDay } },
      }),
      prisma.message.count({
        where: { status: { in: ['PENDING', 'RETRYING', 'SUBMITTED'] } },
      }),
      prisma.earningRecord.aggregate({
        where: { createdAt: { gte: startOfDay } },
        _sum: { rate: true },
      }),
      getIntegrationStatus(),
    ]);

    res.json({
      totalNumbers,
      activeNumbers,
      smsToday,
      smsThisWeek,
      successfulSms,
      failedSms,
      pendingMessages,
      todaysEarnings: earningsSum._sum.rate ?? 0,
      availableBalance: 0,
      mode: integration.mode,
      connectionStatus: {
        lamix:
          integration.smpp.status === 'CONNECTED' || integration.http.status === 'CONNECTED'
            ? 'CONNECTED'
            : integration.smpp.isConfigured || integration.http.isConfigured
              ? integration.smpp.status
              : 'NOT_CONFIGURED',
        smpp: integration.smpp.status,
        http: integration.http.status,
        database: integration.database.status,
        redis: integration.redis.status,
        smsProvider: integration.smpp.status,
      },
      queue: integration.queue,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/traffic', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { period = '24H' } = req.query;

    if (isDemoMode()) {
      res.json({ data: generateDemoTrafficData(period as string) });
      return;
    }

    const hours =
      period === '1H' ? 1 : period === '6H' ? 6 : period === '24H' ? 24 : period === '7D' ? 168 : 720;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const messages = await prisma.message.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    const bucketMs =
      period === '7D' || period === '30D' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
    const buckets = new Map<string, { volume: number; successful: number; failed: number }>();

    for (const msg of messages) {
      const key = new Date(Math.floor(msg.createdAt.getTime() / bucketMs) * bucketMs).toISOString();
      const bucket = buckets.get(key) ?? { volume: 0, successful: 0, failed: 0 };
      bucket.volume++;
      if (msg.status === 'FAILED') bucket.failed++;
      if (msg.status === 'SENT' || msg.status === 'DELIVERED') bucket.successful++;
      buckets.set(key, bucket);
    }

    const earnings = await prisma.earningRecord.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, rate: true },
    });

    const earningsByBucket = new Map<string, number>();
    for (const e of earnings) {
      const key = new Date(Math.floor(e.createdAt.getTime() / bucketMs) * bucketMs).toISOString();
      earningsByBucket.set(key, (earningsByBucket.get(key) ?? 0) + e.rate);
    }

    const data = [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([timestamp, stats]) => ({
        timestamp,
        volume: stats.volume,
        successful: stats.successful,
        failed: stats.failed,
        earnings: (earningsByBucket.get(timestamp) ?? 0).toFixed(4),
      }));

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

function generateDemoTrafficData(period: string) {
  const points =
    period === '1H' ? 12 : period === '6H' ? 24 : period === '24H' ? 24 : period === '7D' ? 7 : 30;
  const data = [];

  for (let i = 0; i < points; i++) {
    data.push({
      timestamp: new Date(
        Date.now() -
          i *
            (period === '7D' || period === '30D' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000)
      ).toISOString(),
      volume: Math.floor(Math.random() * 500) + 100,
      successful: Math.floor(Math.random() * 450) + 90,
      failed: Math.floor(Math.random() * 50) + 10,
      earnings: (Math.random() * 10 + 1).toFixed(2),
    });
  }

  return data.reverse();
}

export default router;
