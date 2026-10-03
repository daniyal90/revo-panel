import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id as string;
    const body = await request.json();
    const { name, whatsappNumber, currentPassword, newPassword } = body;

    // basic validation
    if (name && typeof name !== 'string') return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    if (whatsappNumber && typeof whatsappNumber !== 'string') return NextResponse.json({ error: 'Invalid whatsapp number' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // handle password change
    if (newPassword) {
      if (!currentPassword) return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
      const match = await bcrypt.compare(currentPassword, user.passwordHash || '');
      if (!match) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      if (newPassword.length < 8) return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
      const newHash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({ where: { id: userId }, data: { name: name ?? user.name, whatsappNumber: whatsappNumber ?? user.whatsappNumber, passwordHash: newHash } });
    } else {
      await prisma.user.update({ where: { id: userId }, data: { name: name ?? user.name, whatsappNumber: whatsappNumber ?? user.whatsappNumber } });
    }

    return NextResponse.json({ message: 'Profile updated' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id as string;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, whatsappNumber: true, role: true } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ data: user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
