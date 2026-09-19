import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';

export function setupWebSocket(io: SocketIOServer) {
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('join', (room: string) => {
      socket.join(room);
      logger.info(`Client ${socket.id} joined room: ${room}`);
    });

    socket.on('leave', (room: string) => {
      socket.leave(room);
      logger.info(`Client ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });
}

export function broadcastEvent(io: SocketIOServer, event: string, data: any) {
  io.emit(event, data);
  logger.info(`Broadcasted event: ${event}`);
}

export function broadcastToRoom(io: SocketIOServer, room: string, event: string, data: any) {
  io.to(room).emit(event, data);
  logger.info(`Broadcasted to room ${room}: ${event}`);
}
