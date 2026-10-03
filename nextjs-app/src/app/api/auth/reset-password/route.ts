import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body?.token || '').trim();
    const newPassword = String(body?.password || '');

    if (!token || !newPassword) return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    if (newPassword.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

    const user = await prisma.user.findFirst({ where: { resetToken: token } });
    if (!user) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    if (!user.resetTokenExp || user.resetTokenExp.getTime() < Date.now()) return NextResponse.json({ error: 'Token expired' }, { status: 400 });

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash, resetToken: null, resetTokenExp: null } });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
