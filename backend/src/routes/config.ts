import { Router } from 'express';
import { getAppMode, isDemoMode, isProductionMode } from '../config/mode';

const router = Router();

router.get('/mode', (_req, res) => {
  res.json({
    mode: getAppMode(),
    lamixMode: process.env.LAMIX_MODE || 'development',
    demoMode: isDemoMode(),
    productionMode: isProductionMode(),
  });
});

export default router;
