import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { isDemoMode } from '../config/mode';
import { smppManager } from '../services/smpp';
import { testHttpConnection } from '../services/httpTransport';
import {
  getIntegrationStatus,
  getSmppPublicConfig,
  getHttpPublicConfig,
} from '../services/integrationStatus';

const router = Router();

router.get('/smpp', authenticate, authorize(['ADMIN']), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (isDemoMode()) {
      res.json({
        host: '',
        port: 2775,
        systemId: '',
        systemType: '',
        ton: 0,
        npi: 1,
        tls: false,
        isConfigured: false,
      });
      return;
    }

    res.json(getSmppPublicConfig());
  } catch (error) {
    next(error);
  }
});

router.post(
  '/smpp',
  authenticate,
  authorize(['ADMIN']),
  [
    body('host').optional().isString(),
    body('port').optional().isInt({ min: 1, max: 65535 }),
    body('systemId').optional().isString(),
    body('password').optional().isString(),
    body('systemType').optional().isString(),
    body('ton').optional().isInt(),
    body('npi').optional().isInt(),
    body('tls').optional().isBoolean(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid input', 400);
      }

      if (isDemoMode()) {
        res.json({
          message: 'SMPP configuration is read from environment variables (DEMO MODE preview only)',
        });
        return;
      }

      res.json({
        message:
          'SMPP credentials are loaded from environment variables only. Update LAMIX_SMPP_* in your server .env and restart the application.',
        isConfigured: smppManager.hasValidConfig(),
      });
      logger.info('SMPP config save requested — env-only mode', { service: 'integration', event: 'smpp_save' });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/http', authenticate, authorize(['ADMIN']), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (isDemoMode()) {
      res.json({
        endpoint: '',
        apiKey: '',
        isConfigured: false,
      });
      return;
    }

    res.json(getHttpPublicConfig());
  } catch (error) {
    next(error);
  }
});

router.post(
  '/http',
  authenticate,
  authorize(['ADMIN']),
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (isDemoMode()) {
        res.json({ message: 'HTTP configuration is read from environment variables (DEMO MODE preview only)' });
        return;
      }

      res.json({
        message:
          'HTTP credentials are loaded from environment variables only. Update LAMIX_HTTP_URL and LAMIX_HTTP_TOKEN in your server .env and restart.',
        isConfigured: getHttpPublicConfig().isConfigured,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/smpp/test', authenticate, authorize(['ADMIN']), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (isDemoMode()) {
      res.json({
        message: 'SMPP connection test successful (DEMO MODE)',
        status: 'CONNECTED',
      });
      return;
    }

    const result = await smppManager.testConnection();
    res.json({
      message: result.message,
      status: result.status,
      latency: result.latencyMs,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/http/test', authenticate, authorize(['ADMIN']), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (isDemoMode()) {
      res.json({
        message: 'HTTP API connection test successful (DEMO MODE)',
        status: 'CONNECTED',
      });
      return;
    }

    const result = await testHttpConnection();
    res.json({
      message: result.message,
      status: result.status,
      latency: result.latencyMs,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/status', authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const status = await getIntegrationStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
});

export default router;
