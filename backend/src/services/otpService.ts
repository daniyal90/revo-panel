import Redis from 'ioredis'
import crypto from 'crypto'
import { logger } from '../utils/logger'

const redisClientSingleton: { client?: Redis } = {}

function getRedis() {
  if (!redisClientSingleton.client) {
    redisClientSingleton.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    })
  }
  return redisClientSingleton.client!
}

function getOtpSecret(): string | null {
  const s = process.env.LAMIX_OTP_SECRET || ''
  return s.trim() || null
}

export async function storeOtpForMessage(messageId: string, otp: string, expiryMinutes: number, maxAttempts = 3): Promise<void> {
  const secret = getOtpSecret()
  if (!secret) throw new Error('Missing LAMIX_OTP_SECRET')

  const hmac = crypto.createHmac('sha256', secret).update(otp).digest('hex')
  const key = `otp:${messageId}`
  const payload = JSON.stringify({ hash: hmac, attemptsLeft: maxAttempts })
  const ttl = Math.max(60, Math.floor(expiryMinutes * 60))
  const redis = getRedis()
  await redis.set(key, payload, 'EX', ttl)
  logger.info('Stored OTP in Redis', { messageId, ttl })
}

export async function verifyOtpForMessage(messageId: string, otp: string): Promise<{ ok: boolean; attemptsLeft: number }> {
  const secret = getOtpSecret()
  if (!secret) throw new Error('Missing LAMIX_OTP_SECRET')

  const key = `otp:${messageId}`
  const redis = getRedis()
  const raw = await redis.get(key)
  if (!raw) return { ok: false, attemptsLeft: 0 }
  let parsed: any
  try {
    parsed = JSON.parse(raw)
  } catch {
    await redis.del(key)
    return { ok: false, attemptsLeft: 0 }
  }
  const expected = parsed.hash as string
  const attemptsLeft = typeof parsed.attemptsLeft === 'number' ? parsed.attemptsLeft : 0

  if (attemptsLeft <= 0) {
    await redis.del(key)
    return { ok: false, attemptsLeft: 0 }
  }

  const hmac = crypto.createHmac('sha256', secret).update(otp).digest('hex')
  if (crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expected, 'hex'))) {
    // success: delete key
    await redis.del(key)
    return { ok: true, attemptsLeft }
  }

  // decrement attempts
  const newAttempts = attemptsLeft - 1
  await redis.set(key, JSON.stringify({ hash: expected, attemptsLeft: newAttempts }))
  return { ok: false, attemptsLeft: newAttempts }
}

export async function resendOtpAllowed(messageId: string): Promise<boolean> {
  const key = `otp:${messageId}:resend`
  const redis = getRedis()
  // rate limit: allow 1 resend per 60 seconds, 5 per day
  const short = await redis.get(key)
  if (!short) {
    // set short TTL marker and increment daily counter
    await redis.set(key, '1', 'EX', 60)
    const dayKey = `otp:${messageId}:resend_day`
    const cnt = await redis.incr(dayKey)
    if (cnt === 1) {
      await redis.expire(dayKey, 24 * 3600)
    }
    if (cnt > 5) return false
    return true
  }
  return false
}
