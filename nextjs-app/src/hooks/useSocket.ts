"use client";

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export default function useSocket(room?: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const url = (process.env.NEXT_PUBLIC_SOCKET_URL as string) || 'http://localhost:4001';
    const socket = io(url, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('connect', () => {
      if (room) socket.emit('join', room);
    });
    return () => {
      socket.disconnect();
    };
  }, [room]);

  return socketRef;
}
