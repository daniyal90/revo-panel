import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond successful to avoid account enumeration, but only create token if user exists
    if (!user) {
      console.log('Forgot password requested for non-existing email:', email);
      return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
    }

    // generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetTokenExp: expires } });

    // Build reset link
    const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const link = `${base.replace(/\/$/, '')}/reset-password?token=${token}`;

    // Try to send reset email using configured transporter
    try {
      await sendEmail({
        to: email,
        subject: 'Reset your Revo Panel password',
        text: `A password reset was requested for your account. Use the following link to reset your password: ${link} (valid for 15 minutes). If you did not request this, ignore this email.`,
        html: `<p>A password reset was requested for your account. Click the link below to reset your password (valid for 15 minutes):</p><p><a href="${link}" target="_blank" rel="noopener noreferrer">Reset password</a></p><p>If you did not request this, ignore this email.</p>`,
      });
    } catch (err) {
      // Log error but do not reveal to client
      console.error('Error sending reset email', err);
      console.log(`Password reset link for ${email}: ${link}`);
    }

    return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
