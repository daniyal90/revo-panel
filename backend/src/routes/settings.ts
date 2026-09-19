import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';

const router = Router();

// Get all settings
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { category } = req.query;

    const where = category ? { category: category as string } : {};
    
    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    // Filter out secret values
    const safeSettings = settings.map((setting: { key: string; value: string; isSecret: boolean }) => ({
      ...setting,
      value: setting.isSecret ? '***' : setting.value,
    }));

    res.json(safeSettings);
  } catch (error) {
    next(error);
  }
});

// Update setting
router.patch('/:key', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const isDemo = process.env.DEMO_MODE === 'true';

    if (isDemo) {
      res.json({ message: 'Setting updated (DEMO MODE)' });
      return;
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, category: 'GENERAL', description: '' },
    });

    res.json({ message: 'Setting updated', setting });
  } catch (error) {
    next(error);
  }
});

// Get user preferences
router.get('/preferences', authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // In a real implementation, this would be stored in a user_preferences table
    res.json({
      theme: 'luxury-dark',
      animationIntensity: 'normal',
      compactMode: false,
      timezone: 'UTC',
      currency: 'USD',
      autoRefreshInterval: 30000,
    });
  } catch (error) {
    next(error);
  }
});

// Update user preferences
router.patch('/preferences', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const preferences = req.body;

    // In a real implementation, this would be stored in a user_preferences table
    res.json({ message: 'Preferences updated', preferences });
  } catch (error) {
    next(error);
  }
});

export default router;
