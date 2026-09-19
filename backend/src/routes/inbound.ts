import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { isDemoMode } from '../config/mode';

const router = Router();

// Get inbound messages with pagination and filters
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      country,
      range,
      fromDate,
      toDate,
    } = req.query;

    if (isDemoMode()) {
      const demoMessages = generateDemoInboundMessages();
      res.json({
        messages: demoMessages,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: demoMessages.length,
          totalPages: Math.ceil(demoMessages.length / parseInt(limit as string)),
        },
      });
      return;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { message: { contains: search as string } },
        { cli: { contains: search as string } },
      ];
    }
    
    if (country) where.country = country;
    if (range) where.range = range;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate as string);
      if (toDate) where.createdAt.lte = new Date(toDate as string);
    }

    const [messages, total] = await Promise.all([
      prisma.inboundMessage.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inboundMessage.count({ where }),
    ]);

    res.json({
      messages,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get inbound message details
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const message = await prisma.inboundMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    res.json(message);
  } catch (error) {
    next(error);
  }
});

function generateDemoInboundMessages() {
  return [
    {
      id: '1',
      date: new Date(),
      time: '14:32:15',
      range: 'Sri Lanka LX 14Aug',
      number: '94740341974',
      cli: '947123456789',
      message: 'Your verification code is 123456. It expires in 5 minutes.',
      currency: 'USD',
      payout: 0.018,
      status: 'RECEIVED',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      date: new Date(Date.now() - 3600000),
      time: '13:28:42',
      range: 'India Vodafone',
      number: '919876543210',
      cli: '919876543211',
      message: 'Welcome to our service. Your account has been activated.',
      currency: 'USD',
      payout: 0.015,
      status: 'RECEIVED',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      date: new Date(Date.now() - 7200000),
      time: '12:15:08',
      range: 'Pakistan Jazz',
      number: '923001234567',
      cli: '923001234568',
      message: 'Your order #12345 has been shipped. Track at example.com',
      currency: 'USD',
      payout: 0.012,
      status: 'RECEIVED',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];
}

export default router;
