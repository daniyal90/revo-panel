// Lightweight client helper to emit to the local dev Socket.IO server via fetch bridge
export async function notifyRealtime(event: string, payload: any) {
  try {
    await fetch('/api/realtime/emit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload }),
    });
  } catch (e) {
    // best-effort
    console.warn('notifyRealtime failed', e);
  }
}
