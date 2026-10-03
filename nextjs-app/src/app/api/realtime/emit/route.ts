import { NextResponse } from 'next/server';
import { env } from 'process';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, payload } = body || {};
    // Forward to local socket server via HTTP emit endpoint
    const socketServer = process.env.SOCKET_SERVER_URL || `http://localhost:4001/emit`;
    // best-effort: attempt to deliver; socket-server.js could implement an HTTP bridge if desired
    await fetch(socketServer, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload }),
    }).catch(() => null);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('realtime emit failed', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
