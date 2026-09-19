import { Router } from 'express';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { isDemoMode } from '../config/mode';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { page = '1', limit = '20', search, status, country } = req.query;

    if (isDemoMode()) {
      const demoNumbers = generateDemoNumbers();
      res.json({
        numbers: demoNumbers,
        pagination: {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
          total: demoNumbers.length,
          totalPages: Math.ceil(demoNumbers.length / parseInt(limit as string, 10)),
        },
      });
      return;
    }

    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    const take = parseInt(limit as string, 10);
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { number: { contains: String(search) } },
        { range: { contains: String(search) } },
      ];
    }
    if (status) where.status = status;
    if (country) where.country = country;

    const [numbers, total] = await Promise.all([
      prisma.number.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.number.count({ where }),
    ]);

    res.json({
      numbers,
      pagination: {
        page: parseInt(page as string, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    if (isDemoMode()) {
      res.json({
        id,
        range: 'Demo Range',
        country: 'Demo',
        prefix: '00',
        number: '0000000000',
        payout: 0,
        plan: '7/7',
        status: 'ACTIVE',
        lastActivityAt: new Date().toISOString(),
        totalSms: 0,
        totalEarnings: 0,
        createdAt: new Date().toISOString(),
      });
      return;
    }

    const number = await prisma.number.findUnique({
      where: { id },
      include: {
        messages: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!number) {
      throw new AppError('Number not found', 404);
    }

    res.json(number);
  } catch (error) {
    next(error);
  }
});

router.post('/import', authenticate, authorize(['ADMIN', 'OPERATOR']), async (req: AuthRequest, res, next) => {
  try {
    const { numbers } = req.body;

    if (!Array.isArray(numbers) || numbers.length === 0) {
      throw new AppError('Invalid numbers data', 400);
    }

    if (isDemoMode()) {
      res.json({
        message: 'Numbers imported successfully (DEMO MODE)',
        imported: numbers.length,
        failed: 0,
      });
      return;
    }

    let imported = 0;
    let failed = 0;

    for (const row of numbers) {
      try {
        await prisma.number.upsert({
          where: { number: String(row.number) },
          create: {
            number: String(row.number),
            range: String(row.range ?? 'imported'),
            country: String(row.country ?? 'unknown'),
            prefix: String(row.prefix ?? ''),
            payout: parseFloat(row.payout ?? row.rate ?? '0'),
            plan: String(row.plan ?? '7/7'),
            status: row.status ?? 'ACTIVE',
          },
          update: {
            range: String(row.range ?? 'imported'),
            country: String(row.country ?? 'unknown'),
            prefix: String(row.prefix ?? ''),
            payout: parseFloat(row.payout ?? row.rate ?? '0'),
            plan: String(row.plan ?? '7/7'),
            status: row.status ?? 'ACTIVE',
          },
        });
        imported++;
      } catch {
        failed++;
      }
    }

    res.json({ message: 'Numbers import completed', imported, failed });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', authenticate, authorize(['ADMIN', 'OPERATOR']), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (isDemoMode()) {
      res.json({ message: 'Number status updated (DEMO MODE)' });
      return;
    }

    const number = await prisma.number.update({
      where: { id },
      data: { status },
    });

    res.json({ message: 'Number status updated', number });
  } catch (error) {
    next(error);
  }
});

function generateDemoNumbers() {
  return [
    {
      id: '1',
      range: 'Sri Lanka LX 14Aug',
      country: 'Sri Lanka',
      prefix: '94',
      number: '94740341974',
      payout: 0.018,
      plan: '7/7',
      status: 'ACTIVE',
      lastActivityAt: new Date().toISOString(),
    },
  ];
}

export default router;
