import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { isDemoMode, isProductionMode } from '../config/mode';
import { addSmsToQueue } from '../services/messageQueue';
import { resolveTransport } from '../services/smsTransport';
import { smppManager } from '../services/smpp';
import { testHttpConnection } from '../services/httpTransport';

const router = Router();

router.post(
  '/send',
  authenticate,
  authorize(['ADMIN', 'OPERATOR']),
  [
    body('destination').isMobilePhone('any'),
    body('sender').notEmpty().trim(),
    body('message').notEmpty().trim().isLength({ max: 1600 }),
    body('provider').optional(),
    body('route').optional(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid input', 400);
      }

      const { destination, sender, message, provider, route } = req.body;
      const normalizedDestination = String(destination).replace(/\s/g, '');

      const messageHash = crypto
        .createHash('sha256')
        .update(`${normalizedDestination}:${sender}:${message}:${Math.floor(Date.now() / 60000)}`)
        .digest('hex');

      if (isDemoMode()) {
        const demoMessage = {
          id: crypto.randomUUID(),
          externalId: `DEMO-${crypto.randomUUID().slice(0, 8)}`,
          destination: normalizedDestination,
          sender,
          messageHash,
          status: 'DELIVERED',
          submittedAt: new Date().toISOString(),
          deliveredAt: new Date().toISOString(),
        };

        logger.info('SMS sent (demo)', { service: 'sms', event: 'demo_send', destination });
        res.json({
          message: 'SMS sent successfully (DEMO MODE)',
          sms: demoMessage,
        });
        return;
      }

      const duplicate = await prisma.message.findFirst({
        where: {
          messageHash,
          status: { in: ['PENDING', 'RETRYING', 'SUBMITTED', 'SENT', 'DELIVERED'] },
        },
      });
      if (duplicate) {
        throw new AppError('Duplicate message detected', 409);
      }

      let transport: 'SMPP' | 'HTTP';
      try {
        transport = resolveTransport();
      } catch {
        throw new AppError(
          'Lamix transport not configured. Set LAMIX_SMPP_* or LAMIX_HTTP_* environment variables.',
          503
        );
      }

      const sms = await prisma.message.create({
        data: {
          destination: normalizedDestination,
          sender,
          messageBody: message,
          messageHash,
          transport,
          providerName: provider,
          routeName: route,
          status: 'PENDING',
        },
      });

      await addSmsToQueue({
        messageId: sms.id,
        destination: normalizedDestination,
        sender,
        message,
        transport,
        idempotencyKey: sms.id,
      });

      logger.info('SMS queued', {
        service: 'sms',
        event: 'queued',
        messageId: sms.id,
        destination: normalizedDestination,
      });

      res.status(202).json({
        message: 'SMS queued for delivery',
        sms: {
          id: sms.id,
          destination: sms.destination,
          sender: sms.sender,
          status: sms.status,
          transport: sms.transport,
          createdAt: sms.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/otp',
  authenticate,
  authorize(['ADMIN', 'OPERATOR']),
  [
    body('destination').isMobilePhone('any'),
    body('sender').optional().trim(),
    body('expiry').optional().isInt({ min: 1, max: 10 }),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid input', 400);
      }

      const { destination, expiry = 5 } = req.body;
      const sender = req.body.sender || process.env.LAMIX_DEFAULT_SENDER || 'LAMIX';
      const normalizedDestination = String(destination).replace(/\s/g, '');

      const otp = crypto.randomInt(100000, 1000000).toString();
      const message = `Your verification code is ${otp}. It expires in ${expiry} minutes.`;

      if (isDemoMode()) {
        logger.info('OTP generated (demo)', { service: 'sms', event: 'demo_otp', destination });
        res.json({
          message: 'OTP generated successfully (DEMO MODE)',
          otp,
          destination: normalizedDestination,
          expiry,
        });
        return;
      }

      if (!isProductionMode()) {
        throw new AppError('OTP sending requires LAMIX_MODE=production', 503);
      }

      const messageHash = crypto
        .createHash('sha256')
        .update(`${normalizedDestination}:${sender}:${message}:${Date.now()}`)
        .digest('hex');

      const transport = resolveTransport();
      const sms = await prisma.message.create({
        data: {
          destination: normalizedDestination,
          sender,
          messageBody: message,
          messageHash,
          transport,
          status: 'PENDING',
        },
      });

      await addSmsToQueue({
        messageId: sms.id,
        destination: normalizedDestination,
        sender,
        message,
        transport,
        idempotencyKey: sms.id,
      });

      logger.info('OTP queued', { service: 'sms', event: 'otp_queued', messageId: sms.id });

      res.status(202).json({
        message: 'OTP sent successfully',
        destination: normalizedDestination,
        expiry,
        messageId: sms.id,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const sms = await prisma.message.findUnique({
      where: { id },
      include: {
        deliveryReceipts: true,
        attempts: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!sms) {
      throw new AppError('SMS not found', 404);
    }

    const { messageBody: _body, ...safeSms } = sms;
    res.json(safeSms);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/test-connection',
  authenticate,
  authorize(['ADMIN', 'OPERATOR']),
  async (req: AuthRequest, res, next) => {
    try {
      const { provider = 'auto' } = req.body ?? {};

      if (isDemoMode()) {
        res.json({
          message: 'Connection test successful (DEMO MODE)',
          provider,
          status: 'CONNECTED',
        });
        return;
      }

      if (provider === 'http' || provider === 'HTTP') {
        const result = await testHttpConnection();
        res.json({
          message: result.message,
          provider: 'HTTP',
          status: result.status,
          latency: result.latencyMs,
        });
        return;
      }

      const result = await smppManager.testConnection();
      res.json({
        message: result.message,
        provider: 'SMPP',
        status: result.status,
        latency: result.latencyMs,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
