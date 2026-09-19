import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import numbersRoutes from './routes/numbers';
import smsRoutes from './routes/sms';
import inboundRoutes from './routes/inbound';
import reportsRoutes from './routes/reports';
import integrationRoutes from './routes/integration';
import settingsRoutes from './routes/settings';
import configRoutes from './routes/config';
import { setupWebSocket } from './services/websocket';
import { initializeQueue, shutdownQueue } from './services/messageQueue';
import { smppManager } from './services/smpp';
import { handleDeliverSm } from './services/inboundHandler';
import { getAppMode, isProductionMode } from './config/mode';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    mode: getAppMode(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/numbers', numbersRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/inbound', inboundRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/integration', integrationRoutes);
app.use('/api/settings', settingsRoutes);

app.use(errorHandler);

setupWebSocket(io);
initializeQueue(io);

smppManager.on('stateChange', (state) => {
  io.emit('integration:smpp_state', { state });
});

smppManager.on('deliver_sm', (pdu) => {
  handleDeliverSm(pdu as Record<string, unknown>, io).catch((error) => {
    logger.error('Failed to process deliver_sm', {
      service: 'smpp',
      event: 'deliver_sm_error',
      message: error instanceof Error ? error.message : 'unknown',
    });
  });
});

async function bootstrapProductionSmpp() {
  if (!isProductionMode() || !smppManager.hasValidConfig()) {
    if (isProductionMode() && !smppManager.hasValidConfig()) {
      logger.warn('LAMIX_MODE=production but SMPP is NOT CONFIGURED', {
        service: 'smpp',
        event: 'not_configured',
      });
    }
    return;
  }

  try {
    await smppManager.connect();
  } catch (error) {
    logger.error('Initial SMPP connection failed — reconnect scheduler active', {
      service: 'smpp',
      event: 'initial_connect_failed',
      message: error instanceof Error ? error.message : 'unknown',
    });
  }
}

void bootstrapProductionSmpp();

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  logger.info(`LAMIX SMS Command Center running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`App mode: ${getAppMode()}`);
});

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully`);
  try {
    await smppManager.disconnect();
    await shutdownQueue();
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Shutdown error', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    process.exit(1);
  }
}

process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

export { io };
