import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import type { Message, EarningRecord } from '@prisma/client';
import { isDemoMode } from '../config/mode';

const router = Router();

router.post('/generate', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fromDate, toDate, groupBy = 'day' } = req.body ?? {};

    if (isDemoMode()) {
      res.json(generateDemoReport());
      return;
    }

    const from = fromDate ? new Date(fromDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const to = toDate ? new Date(toDate) : new Date();

    const [messages, earnings] = await Promise.all([
      prisma.message.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { createdAt: true, status: true },
      }),
      prisma.earningRecord.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { createdAt: true, rate: true },
      }),
    ]);

    const msgs = messages as Message[];
    const ers = earnings as EarningRecord[];

    const totalSms = msgs.length;
    const successful = msgs.filter((m: Message) => m.status === 'SENT' || m.status === 'DELIVERED').length;
    const failed = msgs.filter((m: Message) => m.status === 'FAILED').length;
    const pending = msgs.filter((m: Message) => ['PENDING', 'RETRYING', 'SUBMITTED'].includes(m.status)).length;
    const totalEarnings = ers.reduce((sum: number, e: EarningRecord) => sum + Number(e.rate), 0);

    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const byDay = new Map<string, { volume: number; successful: number; failed: number; earnings: number }>();

    for (const m of msgs) {
      const key = dayKey(m.createdAt);
      const row = byDay.get(key) ?? { volume: 0, successful: 0, failed: 0, earnings: 0 };
      row.volume++;
      if (m.status === 'FAILED') row.failed++;
      if (m.status === 'SENT' || m.status === 'DELIVERED') row.successful++;
      byDay.set(key, row);
    }

    for (const e of ers) {
      const key = dayKey(e.createdAt);
      const row = byDay.get(key) ?? { volume: 0, successful: 0, failed: 0, earnings: 0 };
      row.earnings += e.rate;
      byDay.set(key, row);
    }

    const data = [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        volume: stats.volume,
        successful: stats.successful,
        failed: stats.failed,
        earnings: Number(stats.earnings.toFixed(4)),
      }));

    res.json({
      summary: {
        totalSms,
        successful,
        failed,
        pending,
        totalEarnings: Number(totalEarnings.toFixed(4)),
        averagePayout: successful > 0 ? Number((totalEarnings / successful).toFixed(4)) : 0,
        successRate: totalSms > 0 ? Number(((successful / totalSms) * 100).toFixed(1)) : 0,
      },
      data,
      filters: { fromDate: from.toISOString().slice(0, 10), toDate: to.toISOString().slice(0, 10), groupBy },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/export', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { format = 'csv' } = req.body;

    if (isDemoMode()) {
      res.json({
        message: `Report exported as ${format.toUpperCase()} (DEMO MODE)`,
        format,
        downloadUrl: `/api/reports/download/demo-report.${format}`,
      });
      return;
    }

    res.json({
      message: `Report export prepared as ${format.toUpperCase()} (implement download storage as needed)`,
      format,
    });
  } catch (error) {
    next(error);
  }
});

function generateDemoReport() {
  return {
    summary: {
      totalSms: 58234,
      successful: 54892,
      failed: 3342,
      pending: 0,
      totalEarnings: 1048.21,
      averagePayout: 0.018,
      successRate: 94.3,
    },
    data: [],
    filters: { fromDate: '2026-09-13', toDate: '2026-09-19', groupBy: 'day' },
  };
}

export default router;
